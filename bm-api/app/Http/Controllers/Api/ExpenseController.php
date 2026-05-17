<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
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

        $data = $request->validate([
            'category' => ['required', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
            'description' => ['nullable', 'string'],
        ]);

        $expense = $building->expenses()->create($data);

        return response()->json(['data' => $expense], 201);
    }
}
