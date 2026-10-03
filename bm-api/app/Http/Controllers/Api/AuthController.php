<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends BaseApiController
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->where('email', $data['login'])
            ->orWhere('username', $data['login'])
            ->orWhere('phone', $data['login'])
            ->first();

        if (! $user) {
            $user = \App\Models\Owner::query()
                ->where('national_id', $data['login'])
                ->whereNotNull('user_id')
                ->with('user')
                ->first()?->user;
        }

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['بيانات الدخول غير صحيحة.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'login' => ['الحساب غير نشط.'],
            ]);
        }

        $this->updateLegacyUsername($user);

        return [
            'token' => $user->createToken('bm-mobile')->plainTextToken,
            'user' => $this->userPayload($user),
        ];
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $this->updateLegacyUsername($user);

        return [
            'user' => $this->userPayload($user),
        ];
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'username' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
        ], [
            'username.required' => 'أدخل اسم المستخدم.',
            'email.email' => 'أدخل بريدًا إلكترونيًا صحيحًا.',
        ]);

        $username = trim($data['username']);
        $phone = $this->nullableTrim($data['phone'] ?? null);
        $email = $this->nullableTrim($data['email'] ?? null);

        $conflicts = [];

        if ($username !== (string) $user->username && User::where('username', $username)->whereKeyNot($user->id)->exists()) {
            $conflicts['username'] = ['اسم المستخدم مستخدم لحساب آخر.'];
        }

        if ($phone !== $user->phone && $phone && User::where('phone', $phone)->whereKeyNot($user->id)->exists()) {
            $conflicts['phone'] = ['رقم الجوال مستخدم لحساب آخر.'];
        }

        if ($email !== $user->email && $email && User::where('email', $email)->whereKeyNot($user->id)->exists()) {
            $conflicts['email'] = ['البريد الإلكتروني مستخدم لحساب آخر.'];
        }

        if ($conflicts) {
            throw ValidationException::withMessages($conflicts);
        }

        if ($user->isOwner()) {
            $identityNationalIds = $this->ownerIdentityNationalIds($user);
            $ownerQuery = \App\Models\Owner::query();

            if ($identityNationalIds->isNotEmpty()) {
                $ownerQuery->whereIn('national_id', $identityNationalIds->all());
            } else {
                $ownerQuery->where('user_id', $user->id);
            }

            $ownerQuery->update([
                'national_id' => $username,
                'phone' => $phone,
                'email' => $email,
            ]);
        }

        $user->forceFill([
            'username' => $username,
            'phone' => $phone,
            'email' => $email,
        ])->save();

        return [
            'message' => 'تم تحديث بيانات المستخدم بنجاح.',
            'user' => $this->userPayload($user->fresh()),
        ];
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [
            'current_password.required' => 'أدخل الرقم السري الحالي.',
            'password.required' => 'أدخل الرقم السري الجديد.',
            'password.min' => 'الرقم السري الجديد يجب ألا يقل عن 6 أحرف.',
            'password.confirmed' => 'تأكيد الرقم السري غير مطابق.',
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['الرقم السري الحالي غير صحيح.'],
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($data['password']),
        ])->save();

        return ['message' => 'تم تعديل الرقم السري بنجاح.'];
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return ['message' => 'تم تسجيل الخروج بنجاح.'];
    }

    private function ownerIdentityNationalIds(User $user)
    {
        return $user->ownerProfiles()
            ->whereNotNull('national_id')
            ->pluck('national_id')
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->unique()
            ->values();
    }

    private function nullableTrim($value): ?string
    {
        $value = trim((string) ($value ?? ''));
        return $value === '' ? null : $value;
    }

    private function updateLegacyUsername(User $user): void
    {
        if ($user->username !== '10000000') {
            return;
        }

        $exists = User::query()
            ->where('username', '1234')
            ->where('id', '!=', $user->id)
            ->exists();

        if ($exists) {
            return;
        }

        $user->forceFill(['username' => '1234'])->save();
        $user->refresh();
    }

    private function userPayload(User $user): array
    {
        $managedBuildings = $user->isAdmin()
            ? \App\Models\Building::query()->orderBy('name')->get()
            : $user->managedBuildings()->orderBy('name')->get();

        $nationalIds = $this->ownerIdentityNationalIds($user);
        $ownerProfiles = \App\Models\Owner::query()
            ->with('building')
            ->when(
                $nationalIds->isNotEmpty(),
                fn ($query) => $query->whereIn('national_id', $nationalIds->all()),
                fn ($query) => $query->where('user_id', $user->id)
            )
            ->get();

        $ownedBuildings = $ownerProfiles
            ->pluck('building')
            ->filter()
            ->unique('id')
            ->values();

        $managedIds = $managedBuildings->pluck('id')->map(fn ($id) => (int) $id)->all();
        $ownedIds = $ownedBuildings->pluck('id')->map(fn ($id) => (int) $id)->all();

        $buildings = $user->isAdmin()
            ? $managedBuildings
            : $managedBuildings
                ->concat($ownedBuildings)
                ->unique('id')
                ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
                ->values();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username,
            'phone' => $user->phone,
            'role' => $user->role,
            'has_managed_buildings' => $user->isAdmin() || count($managedIds) > 0,
            'buildings' => $buildings->map(fn ($building) => [
                'id' => $building->id,
                'name' => $building->name,
                'district' => $building->district,
                'city' => $building->city,
                'can_manage' => $user->isAdmin() || in_array((int) $building->id, $managedIds, true),
                'is_owner' => in_array((int) $building->id, $ownedIds, true),
            ])->values(),
        ];
    }
}
