<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\Owner;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class OwnerController extends BaseApiController
{
    public function index(Request $request, Building $building)
    {
        $this->assertCanAccessBuilding($request, $building);

        $owners = $building->owners()
            ->with(['apartments'])
            ->orderBy('name')
            ->get()
            ->map(fn ($owner) => $this->ownerSummary($building, $owner));

        return ['data' => $owners];
    }

    public function store(Request $request, Building $building)
    {
        $this->assertManagerOrAdmin($request, $building);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'national_id' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'notes' => ['nullable', 'string'],
            'apartments' => ['required', 'array', 'min:1'],
            'apartments.*.number' => ['required', 'string', 'max:50'],
            'apartments.*.floor' => ['nullable', 'string', 'max:50'],
        ]);

        $data = $this->normalizeOwnerData($data);
        $login = $this->ownerLogin($data);

        $owner = DB::transaction(function () use ($building, $data, $login) {
            $user = $login ? $this->findOrCreateOwnerUser($data, $login) : null;

            $owner = Owner::create([
                'building_id' => $building->id,
                'user_id' => $user?->id,
                'name' => $data['name'],
                'national_id' => $data['national_id'],
                'phone' => $data['phone'],
                'email' => $data['email'],
                'notes' => $data['notes'],
                'status' => 'active',
            ]);

            foreach ($data['apartments'] as $apartment) {
                $building->apartments()->updateOrCreate(
                    ['number' => $apartment['number']],
                    [
                        'owner_id' => $owner->id,
                        'floor' => $apartment['floor'] ?? null,
                        'status' => 'active',
                    ]
                );
            }

            return $owner;
        });

        return response()->json([
            'data' => $this->ownerSummary($building, $owner->fresh(['apartments', 'payments'])),
            'default_password' => $login ? '123456' : null,
        ], 201);
    }

    private function normalizeOwnerData(array $data): array
    {
        foreach (['name', 'national_id', 'phone', 'email', 'notes'] as $key) {
            $value = trim((string) ($data[$key] ?? ''));
            $data[$key] = $value !== '' ? $value : null;
        }

        $data['apartments'] = collect($data['apartments'] ?? [])
            ->map(function ($apartment) {
                $number = trim((string) ($apartment['number'] ?? ''));
                $floor = trim((string) ($apartment['floor'] ?? ''));

                return [
                    'number' => $number,
                    'floor' => $floor !== '' ? $floor : null,
                ];
            })
            ->filter(fn ($apartment) => $apartment['number'] !== '')
            ->unique('number')
            ->values()
            ->all();

        if (count($data['apartments']) === 0) {
            throw ValidationException::withMessages([
                'apartments' => ['أدخل رقم شقة صحيح.'],
            ]);
        }

        return $data;
    }

    private function ownerLogin(array $data): ?string
    {
        return $data['national_id'] ?: ($data['phone'] ?: $data['email']);
    }

    private function findOrCreateOwnerUser(array $data, string $login): User
    {
        $user = User::query()
            ->where('username', $login)
            ->orWhere('phone', $login)
            ->orWhere('email', $login)
            ->first();

        if ($user && ! $user->isOwner()) {
            throw ValidationException::withMessages([
                'national_id' => ['رقم الهوية أو اسم الدخول مستخدم لحساب مدير. استخدم رقم هوية/جوال مختلف للمالك.'],
            ]);
        }

        if (! $user) {
            return User::create([
                'name' => $data['name'],
                'email' => $this->safeEmail($data['email']),
                'username' => $login,
                'phone' => $data['phone'],
                'role' => 'owner',
                'password' => Hash::make('123456'),
                'status' => 'active',
            ]);
        }

        $updates = [
            'name' => $user->name ?: $data['name'],
            'role' => 'owner',
            'status' => $user->status ?: 'active',
        ];

        if (! $user->username) {
            $updates['username'] = $login;
        }

        if (! $user->phone && $data['phone']) {
            $updates['phone'] = $data['phone'];
        }

        if (! $user->email && $data['email'] && $this->safeEmail($data['email'])) {
            $updates['email'] = $data['email'];
        }

        $user->forceFill($updates)->save();

        return $user;
    }

    private function safeEmail(?string $email): ?string
    {
        if (! $email) {
            return null;
        }

        return User::where('email', $email)->exists() ? null : $email;
    }
}
