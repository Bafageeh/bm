<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use Illuminate\Http\Request;

class DashboardController extends BaseApiController
{
    public function building(Request $request, Building $building)
    {
        $this->assertCanAccessBuilding($request, $building);

        $stats = $this->buildingStats($building);
        $owners = $building->owners()
            ->with(['apartments', 'payments'])
            ->orderBy('name')
            ->get()
            ->map(fn ($owner) => $this->ownerSummary($building, $owner));

        return [
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'district' => $building->district,
                'city' => $building->city,
            ],
            'stats' => $stats,
            'owners' => $owners,
            'latest_expenses' => $building->expenses()->latest('expense_date')->limit(5)->get(),
            'latest_payments' => $building->payments()->with('owner:id,name')->latest('payment_date')->limit(5)->get(),
        ];
    }

    public function owner(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isOwner(), 403, 'هذه الشاشة خاصة بالملاك فقط.');

        $profiles = $user->ownerProfiles()->with(['building', 'apartments', 'payments'])->get();

        return [
            'owners' => $profiles->map(function ($owner) {
                $building = $owner->building;
                $summary = $this->ownerSummary($building, $owner);

                return [
                    'building' => [
                        'id' => $building->id,
                        'name' => $building->name,
                        'district' => $building->district,
                        'city' => $building->city,
                    ],
                    'summary' => $summary,
                    'expenses' => $building->expenses()->latest('expense_date')->get()->map(function ($expense) use ($building, $owner) {
                        $apartmentCount = max(1, $building->apartments()->count());
                        $ownerApartments = $owner->apartments()->count();
                        $ownerShare = ((float) $expense->amount / $apartmentCount) * $ownerApartments;

                        return [
                            'id' => $expense->id,
                            'category' => $expense->category,
                            'amount' => (float) $expense->amount,
                            'expense_date' => $expense->expense_date,
                            'description' => $expense->description,
                            'owner_share' => round($ownerShare, 2),
                        ];
                    })->values(),
                ];
            })->values(),
        ];
    }
}
