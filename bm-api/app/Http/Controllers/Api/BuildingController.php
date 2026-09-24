<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class BuildingController extends BaseApiController
{
    public function index(Request $request)
    {
        $user = $request->user();

        $buildings = $user->isAdmin()
            ? Building::query()->withCount(['apartments', 'owners', 'expenses', 'payments'])->orderBy('name')->get()
            : $user->managedBuildings()->withCount(['apartments', 'owners', 'expenses', 'payments'])->orderBy('name')->get();

        if ($user->isOwner()) {
            $buildings = $user->ownerProfiles()->with('building')->get()->pluck('building')->filter()->unique('id')->values();
            $buildings->each->loadCount(['apartments', 'owners', 'expenses', 'payments']);
        }

        return ['data' => $buildings];
    }

    public function store(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isAdmin() || $user->isManager(), 403, 'إنشاء المباني متاح لمدير التطبيق أو مدير المبنى فقط.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'apartment_count' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'annual_cycle_starts_on' => ['nullable', 'date'],
            'manager_name' => ['nullable', 'string', 'max:255'],
            'manager_login' => ['nullable', 'string', 'max:255'],
            'manager_phone' => ['nullable', 'string', 'max:50'],
        ]);

        $building = DB::transaction(function () use ($data, $user) {
            $building = Building::create([
                'name' => trim($data['name']),
                'district' => $this->nullableTrim($data['district'] ?? null),
                'city' => $this->nullableTrim($data['city'] ?? null),
                'address' => $this->nullableTrim($data['address'] ?? null),
                'annual_cycle_starts_on' => $data['annual_cycle_starts_on'] ?? null,
                'status' => 'active',
            ]);

            if ($user->isManager()) {
                $building->managers()->syncWithoutDetaching([$user->id => ['role' => 'manager']]);
            } elseif (! empty($data['manager_login'])) {
                $manager = User::firstOrCreate(
                    ['username' => trim($data['manager_login'])],
                    [
                        'name' => $this->nullableTrim($data['manager_name'] ?? null) ?: trim($data['manager_login']),
                        'phone' => $this->nullableTrim($data['manager_phone'] ?? null),
                        'role' => 'manager',
                        'password' => Hash::make('123456'),
                        'status' => 'active',
                    ]
                );

                $building->managers()->syncWithoutDetaching([$manager->id => ['role' => 'manager']]);
            }

            $this->syncApartmentCount($building, (int) ($data['apartment_count'] ?? 0));
            $this->seedExpenseCategories($building);

            return $building;
        });

        return response()->json([
            'data' => $building->fresh()->load('managers')->loadCount(['apartments', 'owners', 'expenses', 'payments']),
        ], 201);
    }

    public function update(Request $request, Building $building)
    {
        $this->assertManagerOrAdmin($request, $building);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'apartment_count' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'annual_cycle_starts_on' => ['nullable', 'date'],
        ]);

        DB::transaction(function () use ($building, $data) {
            $building->forceFill([
                'name' => trim($data['name']),
                'district' => $this->nullableTrim($data['district'] ?? null),
                'city' => $this->nullableTrim($data['city'] ?? null),
                'address' => $this->nullableTrim($data['address'] ?? null),
                'annual_cycle_starts_on' => $data['annual_cycle_starts_on'] ?? $building->annual_cycle_starts_on,
            ])->save();

            if (array_key_exists('apartment_count', $data)) {
                $this->syncApartmentCount($building, (int) $data['apartment_count']);
            }
        });

        return [
            'message' => 'تم تحديث بيانات المبنى',
            'data' => $building->fresh()->loadCount(['apartments', 'owners', 'expenses', 'payments']),
        ];
    }

    public function destroy(Request $request, Building $building)
    {
        $this->assertManagerOrAdmin($request, $building);

        DB::transaction(function () use ($building) {
            foreach ($building->expenses()->with('attachments')->get() as $expense) {
                foreach ($expense->attachments as $attachment) {
                    $attachment->delete();
                }
                $expense->delete();
            }

            $building->payments()->delete();
            $building->apartments()->delete();
            $building->owners()->delete();
            $building->expenseCategories()->delete();

            if (Schema::hasTable('expense_notification_events')) {
                DB::table('expense_notification_events')->where('building_id', $building->id)->delete();
            }
            if (Schema::hasTable('user_notifications')) {
                DB::table('user_notifications')->where('building_id', $building->id)->update(['building_id' => null]);
            }

            $building->managers()->detach();
            $building->delete();
        });

        return response()->json(['message' => 'تم حذف المبنى وجميع بياناته المرتبطة']);
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

        DB::transaction(fn () => $this->syncApartmentCount($building, $targetCount));

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

    private function syncApartmentCount(Building $building, int $targetCount): void
    {
        $targetNumbers = $targetCount > 0
            ? collect(range(1, $targetCount))->map(fn ($number) => (string) $number)->values()
            : collect();

        $extraQuery = $building->apartments();
        if ($targetNumbers->isNotEmpty()) {
            $extraQuery->whereNotIn('number', $targetNumbers->all());
        }

        $extraApartments = $extraQuery->orderByRaw('CAST(number AS UNSIGNED), number')->get();
        $assignedExtraNumbers = $extraApartments
            ->whereNotNull('owner_id')
            ->pluck('number')
            ->values();

        if ($assignedExtraNumbers->isNotEmpty()) {
            throw ValidationException::withMessages([
                'apartment_count' => [
                    'لا يمكن تقليل عدد الشقق لأن الشقق التالية تحتوي على بيانات ملاك: ' .
                    $assignedExtraNumbers->implode('، '),
                ],
            ]);
        }

        if ($extraApartments->isNotEmpty()) {
            $building->apartments()->whereKey($extraApartments->pluck('id'))->delete();
        }

        $existingNumbers = $building->apartments()
            ->pluck('number')
            ->map(fn ($number) => (string) $number)
            ->all();

        foreach ($targetNumbers as $number) {
            if (in_array($number, $existingNumbers, true)) {
                continue;
            }

            $building->apartments()->create([
                'number' => $number,
                'status' => 'active',
            ]);
        }
    }

    private function seedExpenseCategories(Building $building): void
    {
        if (! Schema::hasTable('expense_categories') || $building->expenseCategories()->exists()) {
            return;
        }

        $defaults = ['حارس', 'كهرباء', 'مياه', 'نظافة', 'صيانة', 'مشتريات', 'مصعد'];
        foreach ($defaults as $index => $name) {
            $values = [
                'name' => $name,
                'sort_order' => ($index + 1) * 10,
            ];
            if (Schema::hasColumn('expense_categories', 'notes')) {
                $values['notes'] = null;
            }
            if (Schema::hasColumn('expense_categories', 'is_active')) {
                $values['is_active'] = false;
            }
            $building->expenseCategories()->create($values);
        }
    }

    private function nullableTrim($value): ?string
    {
        $value = trim((string) ($value ?? ''));
        return $value === '' ? null : $value;
    }
}
