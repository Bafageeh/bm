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

        $login = trim((string) $data['login']);
        $password = (string) $data['password'];
        $identityType = null;
        $user = null;

        $user = User::query()->where('username', $login)->first();
        if ($user) {
            $identityType = 'username';
        }

        if (! $user) {
            $user = User::query()->where('email', $login)->first();
            if ($user) {
                $identityType = 'email';
            }
        }

        if (! $user) {
            $ownerUserIds = \App\Models\Owner::query()
                ->where('national_id', $login)
                ->whereNotNull('user_id')
                ->pluck('user_id')
                ->unique()
                ->values();

            if ($ownerUserIds->isNotEmpty()) {
                $user = $this->matchingUserForIds($ownerUserIds, $password);
                if ($user) {
                    $identityType = 'national_id';
                }
            }
        }

        if (! $user) {
            $phoneUserIds = User::query()
                ->where('phone', $login)
                ->pluck('id');

            $ownerPhoneUserIds = \App\Models\Owner::query()
                ->where('phone', $login)
                ->whereNotNull('user_id')
                ->pluck('user_id');

            $candidateIds = $phoneUserIds
                ->concat($ownerPhoneUserIds)
                ->unique()
                ->values();

            if ($candidateIds->isNotEmpty()) {
                $user = $this->matchingUserForIds($candidateIds, $password);
                if ($user) {
                    $identityType = 'phone';
                }
            }
        }

        if (! $user || ! Hash::check($password, $user->password)) {
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

        $tokenName = $this->mobileTokenName($identityType ?: 'user', $login);

        return [
            'token' => $user->createToken($tokenName)->plainTextToken,
            'user' => $this->userPayload($user, $identityType, $login),
        ];
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $this->updateLegacyUsername($user);
        $identity = $this->requestLoginIdentity($request);

        return [
            'user' => $this->userPayload(
                $user,
                $identity['type'] ?? null,
                $identity['value'] ?? null
            ),
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

    private function userPayload(User $user, ?string $identityType = null, ?string $identityValue = null): array
    {
        $managedBuildings = $user->isAdmin()
            ? \App\Models\Building::query()->orderBy('name')->get()
            : $user->managedBuildings()->orderBy('name')->get();

        $ownerProfiles = $this->ownerProfilesForIdentity(
            $user,
            $identityType,
            $identityValue,
            ['building']
        );

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

    private function matchingUserForIds($ids, string $password): ?User
    {
        return User::query()
            ->whereIn('id', collect($ids)->filter()->unique()->values()->all())
            ->withCount('managedBuildings')
            ->get()
            ->filter(fn (User $candidate) => Hash::check($password, $candidate->password))
            ->sortByDesc(function (User $candidate) {
                return
                    ($candidate->status === 'active' ? 100000 : 0) +
                    ($candidate->isAdmin() ? 10000 : 0) +
                    ((int) ($candidate->managed_buildings_count ?? 0) * 100) +
                    (int) $candidate->id;
            })
            ->first();
    }

    private function mobileTokenName(string $type, string $value): string
    {
        $encoded = rtrim(strtr(base64_encode($value), '+/', '-_'), '=');

        return 'bm-mobile|' . $type . '|' . $encoded;
    }
}
