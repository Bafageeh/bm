<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\Owner;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

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

        $login = $data['national_id'] ?: ($data['phone'] ?: ($data['email'] ?: null));

        $user = null;
        if ($login) {
            $user = User::firstOrCreate(
                ['username' => $login],
                [
                    'name' => $data['name'],
                    'email' => $data['email'] ?? null,
                    'phone' => $data['phone'] ?? null,
                    'role' => 'owner',
                    'password' => Hash::make('123456'),
                    'status' => 'active',
                ]
            );
        }

        $owner = Owner::create([
            'building_id' => $building->id,
            'user_id' => $user?->id,
            'name' => $data['name'],
            'national_id' => $data['national_id'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'notes' => $data['notes'] ?? null,
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

        return response()->json([
            'data' => $this->ownerSummary($building, $owner->fresh(['apartments', 'payments'])),
            'default_password' => $user ? '123456' : null,
        ], 201);
    }
}
