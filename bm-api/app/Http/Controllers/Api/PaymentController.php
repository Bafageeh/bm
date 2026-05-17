<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\Owner;
use Illuminate\Http\Request;

class PaymentController extends BaseApiController
{
    public function index(Request $request, Building $building)
    {
        $this->assertCanAccessBuilding($request, $building);

        $payments = $building->payments()
            ->with('owner:id,name')
            ->latest('payment_date')
            ->latest('id')
            ->get();

        return ['data' => $payments];
    }

    public function store(Request $request, Building $building)
    {
        $this->assertManagerOrAdmin($request, $building);

        $data = $request->validate([
            'owner_id' => ['required', 'integer'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'method' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $owner = Owner::where('building_id', $building->id)->findOrFail($data['owner_id']);

        $payment = $owner->payments()->create([
            'building_id' => $building->id,
            'amount' => $data['amount'],
            'payment_date' => $data['payment_date'],
            'method' => $data['method'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json(['data' => $payment->load('owner:id,name')], 201);
    }
}
