<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends BaseApiController
{
    public function index(Request $request, Building $building)
    {
        $this->assertCanAccessBuilding($request, $building);

        $expenses = $building->expenses()
            ->with(['owners:id,name'])
            ->latest('expense_date')
            ->latest('id')
            ->get();

        return ['data' => $expenses];
    }

    public function store(Request $request, Building $building)
    {
        $this->assertManagerOrAdmin($request, $building);

        $data = $this->validatedData($request, $building);
        $ownerIds = $data['owner_ids'] ?? [];
        unset($data['owner_ids']);

        $expense = DB::transaction(function () use ($building, $data, $ownerIds) {
            $expense = $building->expenses()->create($data);
            $this->syncTargetOwners($expense, $ownerIds);
            return $expense;
        });

        return response()->json(['data' => $expense->fresh(['owners:id,name'])], 201);
    }

    public function update(Request $request, Building $building, Expense $expense)
    {
        $this->assertManagerOrAdmin($request, $building);
        $this->assertExpenseBelongsToBuilding($building, $expense);

        $data = $this->validatedData($request, $building);
        $ownerIds = $data['owner_ids'] ?? [];
        unset($data['owner_ids']);

        DB::transaction(function () use ($expense, $data, $ownerIds) {
            $expense->update($data);
            $this->syncTargetOwners($expense, $ownerIds);
        });

        return ['data' => $expense->fresh(['owners:id,name'])];
    }

    public function destroy(Request $request, Building $building, Expense $expense)
    {
        $this->assertManagerOrAdmin($request, $building);
        $this->assertExpenseBelongsToBuilding($building, $expense);

        $expense->delete();

        return response()->json(['message' => 'تم حذف المصروف']);
    }

    private function validatedData(Request $request, Building $building): array
    {
        $data = $request->validate([
            'category' => ['required', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date_format:Y-m-d'],
            'description' => ['nullable', 'string'],
            'scope' => ['nullable', 'string', 'in:all,selected'],
            'owner_ids' => ['nullable', 'array'],
            'owner_ids.*' => ['integer'],
        ]);

        $data['expense_date'] = substr((string) $data['expense_date'], 0, 10);
        $data['scope'] = $data['scope'] ?? 'all';

        if ($data['scope'] === 'selected') {
            $ownerIds = collect($data['owner_ids'] ?? [])->map(fn ($id) => (int) $id)->unique()->values();
            abort_if($ownerIds->isEmpty(), 422, 'اختر مالكًا واحدًا على الأقل للمصروف المخصص');

            $validCount = $building->owners()->whereIn('id', $ownerIds)->count();
            abort_if($validCount !== $ownerIds->count(), 422, 'يوجد مالك غير تابع لهذا المبنى');

            $data['owner_ids'] = $ownerIds->all();
        } else {
            $data['scope'] = 'all';
            $data['owner_ids'] = [];
        }

        return $data;
    }

    private function syncTargetOwners(Expense $expense, array $ownerIds): void
    {
        if ($expense->scope !== 'selected') {
            $expense->owners()->detach();
            return;
        }

        $share = count($ownerIds) > 0 ? round(((float) $expense->amount) / count($ownerIds), 2) : null;
        $sync = collect($ownerIds)->mapWithKeys(fn ($ownerId) => [$ownerId => ['share_amount' => $share]])->all();
        $expense->owners()->sync($sync);
    }

    private function assertExpenseBelongsToBuilding(Building $building, Expense $expense): void
    {
        abort_unless((int) $expense->building_id === (int) $building->id, 404, 'المصروف غير موجود في هذا المبنى');
    }
}
