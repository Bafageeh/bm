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
        $buildings = $user->isAdmin()
            ? \App\Models\Building::query()->orderBy('name')->get()
            : $user->managedBuildings()->orderBy('name')->get();

        if ($user->isOwner()) {
            $buildings = $user->ownerProfiles()->with('building')->get()->pluck('building')->filter()->values();
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username,
            'phone' => $user->phone,
            'role' => $user->role,
            'buildings' => $buildings->map(fn ($building) => [
                'id' => $building->id,
                'name' => $building->name,
                'district' => $building->district,
                'city' => $building->city,
            ])->values(),
        ];
    }
}
