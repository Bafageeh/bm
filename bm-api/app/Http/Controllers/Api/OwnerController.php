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
            ->with(['apartments', 'payments', 'user'])
            ->orderBy('name')
            ->get()
            ->map(fn ($owner) => $this->ownerSummary($building, $owner));

        return ['data' => $owners];
    }

    public function store(Request $request, Building $building)
    {
        $this->assertManagerOrAdmin($request, $building);

        $data = $this->validateOwner($request);
        $data = $this->normalizeOwnerData($data);
        $this->assertUniqueOwnerIdentity($data['national_id']);
        $login = $this->ownerLogin($data);

        $owner = DB::transaction(function () use ($building, $data, $login) {
            $user = $this->findOrCreateOwnerUser($data, $login);

            $owner = Owner::create([
                'building_id' => $building->id,
                'user_id' => $user->id,
                'name' => $data['name'],
                'national_id' => $data['national_id'],
                'phone' => $data['phone'],
                'email' => $data['email'],
                'notes' => $data['notes'],
                'status' => 'active',
            ]);

            $this->syncOwnerApartments($building, $owner, $data['apartments']);

            return $owner;
        });

        return response()->json([
            'data' => $this->ownerSummary($building, $owner->fresh(['apartments', 'payments', 'user'])),
            'default_password' => '123456',
        ], 201);
    }

    public function update(Request $request, Building $building, Owner $owner)
    {
        $this->assertManagerOrAdmin($request, $building);
        $this->assertOwnerBelongsToBuilding($building, $owner);

        $data = $this->validateOwner($request);
        $data = $this->normalizeOwnerData($data);
        $this->assertUniqueOwnerIdentity($data['national_id'], $owner->id, $owner->user_id);
        $login = $this->ownerLogin($data);

        $owner = DB::transaction(function () use ($building, $owner, $data, $login) {
            $user = $this->findOrCreateOwnerUser($data, $login, $owner->user_id);

            $owner->update([
                'user_id' => $user->id,
                'name' => $data['name'],
                'national_id' => $data['national_id'],
                'phone' => $data['phone'],
                'email' => $data['email'],
                'notes' => $data['notes'],
                'status' => 'active',
            ]);

            $this->syncOwnerApartments($building, $owner, $data['apartments']);

            return $owner;
        });

        return response()->json([
            'data' => $this->ownerSummary($building, $owner->fresh(['apartments', 'payments', 'user'])),
            'default_password' => '123456',
        ]);
    }

    public function destroy(Request $request, Building $building, Owner $owner)
    {
        $this->assertManagerOrAdmin($request, $building);
        $this->assertOwnerBelongsToBuilding($building, $owner);

        DB::transaction(function () use ($building, $owner) {
            $building->apartments()->where('owner_id', $owner->id)->update(['owner_id' => null]);
            $owner->payments()->delete();
            $owner->delete();
        });

        return response()->json(['message' => 'تم حذف المالك بنجاح.']);
    }

    private function validateOwner(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'national_id' => ['required', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'notes' => ['nullable', 'string'],
            'apartments' => ['required', 'array', 'min:1'],
            'apartments.*.number' => ['required', 'string', 'regex:/^[0-9]+$/', 'max:50'],
            'apartments.*.floor' => ['nullable', 'string', 'max:50'],
        ], [
            'name.required' => 'اسم المالك مطلوب.',
            'national_id.required' => 'رقم الهوية أو اسم الدخول مطلوب.',
            'email.email' => 'صيغة البريد الإلكتروني غير صحيحة.',
            'apartments.required' => 'رقم الشقة مطلوب.',
            'apartments.array' => 'رقم الشقة مطلوب.',
            'apartments.min' => 'أدخل رقم شقة واحد على الأقل.',
            'apartments.*.number.required' => 'رقم الشقة مطلوب.',
            'apartments.*.number.regex' => 'رقم الشقة يجب أن يكون أرقام فقط.',
        ]);
    }

    private function normalizeOwnerData(array $data): array
    {
        foreach (['name', 'national_id', 'phone', 'email', 'notes'] as $key) {
            $value = trim((string) ($data[$key] ?? ''));
            $data[$key] = $value !== '' ? $value : null;
        }

        if (! $data['national_id']) {
            throw ValidationException::withMessages([
                'national_id' => ['رقم هوية المالك مطلوب ويستخدم كاسم دخول.'],
            ]);
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
                'apartments' => ['رقم الشقة مطلوب.'],
            ]);
        }

        foreach ($data['apartments'] as $apartment) {
            if (! preg_match('/^[0-9]+$/', $apartment['number'])) {
                throw ValidationException::withMessages([
                    'apartments' => ['رقم الشقة يجب أن يكون أرقام فقط.'],
                ]);
            }
        }

        return $data;
    }

    private function assertUniqueOwnerIdentity(string $login, ?int $exceptOwnerId = null, ?int $exceptUserId = null): void
    {
        $ownerExists = Owner::query()
            ->where('national_id', $login)
            ->when($exceptOwnerId, fn ($query) => $query->whereKeyNot($exceptOwnerId))
            ->exists();

        $userExists = User::query()
            ->where(function ($query) use ($login) {
                $query->where('username', $login)
                    ->orWhere('phone', $login)
                    ->orWhere('email', $login);
            })
            ->when($exceptUserId, fn ($query) => $query->whereKeyNot($exceptUserId))
            ->exists();

        if ($ownerExists || $userExists) {
            throw ValidationException::withMessages([
                'national_id' => ['رقم الهوية أو اسم الدخول مستخدم مسبقًا ولا يمكن تكراره.'],
            ]);
        }
    }

    private function syncOwnerApartments(Building $building, Owner $owner, array $apartments): void
    {
        $numbers = collect($apartments)->pluck('number')->all();

        $conflictingNumbers = $building->apartments()
            ->whereIn('number', $numbers)
            ->whereNotNull('owner_id')
            ->where('owner_id', '<>', $owner->id)
            ->pluck('number')
            ->values()
            ->all();

        if (count($conflictingNumbers) > 0) {
            throw ValidationException::withMessages([
                'apartments' => ['رقم الشقة مستخدم مسبقًا في هذا المبنى: ' . implode('، ', $conflictingNumbers)],
            ]);
        }

        $building->apartments()
            ->where('owner_id', $owner->id)
            ->whereNotIn('number', $numbers)
            ->update(['owner_id' => null]);

        foreach ($apartments as $apartment) {
            $building->apartments()->updateOrCreate(
                ['number' => $apartment['number']],
                [
                    'owner_id' => $owner->id,
                    'floor' => $apartment['floor'] ?? null,
                    'status' => 'active',
                ]
            );
        }
    }

    private function assertOwnerBelongsToBuilding(Building $building, Owner $owner): void
    {
        if ((int) $owner->building_id !== (int) $building->id) {
            abort(404, 'المالك غير موجود في هذا المبنى.');
        }
    }

    private function ownerLogin(array $data): string
    {
        return (string) $data['national_id'];
    }

    private function findOrCreateOwnerUser(array $data, string $login, ?int $currentUserId = null): User
    {
        $currentUser = $currentUserId ? User::find($currentUserId) : null;

        $loginUser = User::query()
            ->where(function ($query) use ($login) {
                $query->where('username', $login)
                    ->orWhere('phone', $login)
                    ->orWhere('email', $login);
            })
            ->first();

        $user = $currentUser ?: $loginUser;

        if ($loginUser && $currentUser && (int) $loginUser->id !== (int) $currentUser->id) {
            if (! $loginUser->isOwner()) {
                throw ValidationException::withMessages([
                    'national_id' => ['رقم الهوية مستخدم لحساب مدير. استخدم رقم هوية مختلف للمالك.'],
                ]);
            }

            throw ValidationException::withMessages([
                'national_id' => ['رقم الهوية مستخدم لمالك آخر.'],
            ]);
        }

        if ($loginUser && ! $currentUser) {
            throw ValidationException::withMessages([
                'national_id' => ['رقم الهوية أو اسم الدخول مستخدم مسبقًا ولا يمكن تكراره.'],
            ]);
        }

        if ($user && ! $user->isOwner()) {
            throw ValidationException::withMessages([
                'national_id' => ['رقم الهوية أو اسم الدخول مستخدم لحساب مدير. استخدم رقم هوية مختلف للمالك.'],
            ]);
        }

        if (! $user) {
            return User::create([
                'name' => $data['name'],
                'email' => $this->emailForUser($data['email'], $login),
                'username' => $login,
                'phone' => $data['phone'],
                'role' => 'owner',
                'password' => Hash::make('123456'),
                'status' => 'active',
            ]);
        }

        $updates = [
            'name' => $data['name'],
            'role' => 'owner',
            'status' => $user->status ?: 'active',
            'username' => $login,
            'phone' => $data['phone'],
        ];

        $email = $this->emailForUser($data['email'], $login, $user->id);
        if ($email) {
            $updates['email'] = $email;
        }

        $user->forceFill($updates)->save();

        return $user;
    }

    private function emailForUser(?string $email, string $login, ?int $exceptUserId = null): string
    {
        if ($email && ! User::where('email', $email)->when($exceptUserId, fn ($query) => $query->whereKeyNot($exceptUserId))->exists()) {
            return $email;
        }

        $generatedEmail = 'owner-' . sha1($login) . '@bm.local';

        if (! User::where('email', $generatedEmail)->when($exceptUserId, fn ($query) => $query->whereKeyNot($exceptUserId))->exists()) {
            return $generatedEmail;
        }

        return 'owner-' . sha1($login . '-' . ($exceptUserId ?: uniqid('', true))) . '@bm.local';
    }
}
