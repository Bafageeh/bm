<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends BaseApiController
{
    public function index(Request $request, Building $building)
    {
        $this->assertCanAccessBuilding($request, $building);

        $expenses = $building->expenses()
            ->latest('expense_date')
            ->latest('id')
            ->get();

        return ['data' => $expenses];
    }

    public function store(Request $request, Building $building)
    {
        $this->assertManagerOrAdmin($request, $building);

        $data = $this->validatedData($request);

        $expense = $building->expenses()->create($data);

        return response()->json(['data' => $expense], 201);
    }

    public function update(Request $request, Building $building, Expense $expense)
    {
        $this->assertManagerOrAdmin($request, $building);
        $this->assertExpenseBelongsToBuilding($building, $expense);

        $expense->update($this->validatedData($request));

        return ['data' => $expense->fresh()];
    }

    public function destroy(Request $request, Building $building, Expense $expense)
    {
        $this->assertManagerOrAdmin($request, $building);
        $this->assertExpenseBelongsToBuilding($building, $expense);

        $expense->delete();

        return response()->json(['message' => 'تم حذف المصروف']);
    }

    private function validatedData(Request $request): array
    {
        return $request->validate([
            'category' => ['required', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
            'description' => ['nullable', 'string'],
        ]);
    }

    private function assertExpenseBelongsToBuilding(Building $building, Expense $expense): void
    {
        abort_unless((int) $expense->building_id === (int) $building->id, 404, 'المصروف غير موجود في هذا المبنى');
    }
}
