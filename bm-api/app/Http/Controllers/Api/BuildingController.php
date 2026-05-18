<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class BuildingController extends BaseApiController
{
    public function index(Request $request)
    {
        $user = $request->user();

        $buildings = $user->isAdmin()
            ? Building::query()->orderBy('name')->get()
            : $user->managedBuildings()->orderBy('name')->get();

        if ($user->isOwner()) {
            $buildings = $user->ownerProfiles()->with('building')->get()->pluck('building')->filter()->values();
        }

        return ['data' => $buildings];
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->isAdmin(), 403, 'إنشاء المباني متاح لمدير التطبيق فقط.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'manager_name' => ['nullable', 'string', 'max:255'],
            'manager_login' => ['nullable', 'string', 'max:255'],
            'manager_phone' => ['nullable', 'string', 'max:50'],
        ]);

        $building = Building::create($data);

        if (! empty($data['manager_login'])) {
            $manager = User::firstOrCreate(
                ['username' => $data['manager_login']],
                [
                    'name' => $data['manager_name'] ?? $data['manager_login'],
                    'phone' => $data['manager_phone'] ?? null,
                    'role' => 'manager',
                    'password' => Hash::make('123456'),
                    'status' => 'active',
                ]
            );

            $building->managers()->syncWithoutDetaching([$manager->id => ['role' => 'manager']]);
        }

        return response()->json(['data' => $building->load('managers')], 201);
    }

    public function show(Request $request, Building $building)
    {
        $this->assertCanAccessBuilding($request, $building);

        return ['data' => $building->loadCount(['apartments', 'owners', 'expenses', 'payments'])];
    }

    public function updateApartmentCount(Request $request, Building $building)
    {
        $this->assertManagerOrAdmin($request, $building);

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'apartment_count' => ['required', 'integer', 'min:0', 'max:1000'],
            'annual_cycle_starts_on' => ['nullable', 'date'],
        ]);

        $targetCount = (int) $data['apartment_count'];
        $currentCount = $building->apartments()->count();

        if ($targetCount > $currentCount) {
            $existingNumbers = $building->apartments()->pluck('number')->map(fn ($number) => (string) $number)->all();

            for ($number = 1; $building->apartments()->count() < $targetCount && $number <= 1000; $number++) {
                if (in_array((string) $number, $existingNumbers, true)) {
                    continue;
                }

                $building->apartments()->create([
                    'number' => (string) $number,
                    'status' => 'active',
                ]);

                $existingNumbers[] = (string) $number;
            }
        }

        $updateData = [];

        if (array_key_exists('name', $data) && trim((string) $data['name']) !== '') {
            $updateData['name'] = trim((string) $data['name']);
        }

        if (Schema::hasColumn('buildings', 'apartment_count')) {
            $updateData['apartment_count'] = $targetCount;
        }

        if (Schema::hasColumn('buildings', 'annual_cycle_starts_on')) {
            $updateData['annual_cycle_starts_on'] = $data['annual_cycle_starts_on'] ?? null;
        }

        if (! empty($updateData)) {
            $building->forceFill($updateData)->save();
        }

        return [
            'message' => 'تم حفظ إعدادات المبنى',
            'data' => $building->fresh()->loadCount(['apartments', 'owners', 'expenses', 'payments']),
        ];
    }
}
