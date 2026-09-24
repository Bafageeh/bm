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
        $ownerModels = $building->owners()
            ->with(['apartments', 'payments', 'user'])
            ->orderBy('name')
            ->get();
        $owners = $ownerModels
            ->map(fn ($owner) => $this->ownerSummary($building, $owner))
            ->values();
        $ownersById = $owners->keyBy('id');

        $apartments = $building->apartments()
            ->orderByRaw('CAST(number AS UNSIGNED), number')
            ->get()
            ->map(function ($apartment) use ($ownersById) {
                return [
                    'id' => $apartment->id,
                    'number' => $apartment->number,
                    'floor' => $apartment->floor,
                    'status' => $apartment->status,
                    'notes' => $apartment->notes,
                    'owner_id' => $apartment->owner_id,
                    'owner' => $apartment->owner_id ? $ownersById->get($apartment->owner_id) : null,
                ];
            })
            ->values();

        return [
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'district' => $building->district,
                'city' => $building->city,
                'annual_cycle_starts_on' => optional($building->annual_cycle_starts_on)->format('Y-m-d'),
            ],
            'stats' => $stats,
            'owners' => $owners,
            'apartments' => $apartments,
            'latest_expenses' => $building->expenses()->latest('expense_date')->limit(5)->get(),
            'latest_payments' => $building->payments()->with('owner:id,name')->latest('payment_date')->limit(5)->get(),
        ];
    }

    public function owner(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isOwner(), 403, 'هذه الشاشة خاصة بالملاك فقط.');

        $nationalIds = $user->ownerProfiles()
            ->whereNotNull('national_id')
            ->pluck('national_id')
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->unique()
            ->values();

        $profiles = \App\Models\Owner::query()
            ->with(['building', 'apartments', 'payments'])
            ->when($nationalIds->isNotEmpty(), fn ($query) => $query->whereIn('national_id', $nationalIds->all()), fn ($query) => $query->where('user_id', $user->id))
            ->get();

        return [
            'owners' => $profiles->map(function ($owner) {
                $building = $owner->building;
                $summary = $this->ownerSummary($building, $owner);
                $buildingOwners = $building->owners()
                    ->with(['apartments', 'payments', 'user'])
                    ->orderBy('name')
                    ->get()
                    ->map(fn ($buildingOwner) => $this->ownerSummary($building, $buildingOwner))
                    ->values();

                return [
                    'building' => [
                        'id' => $building->id,
                        'name' => $building->name,
                        'district' => $building->district,
                        'city' => $building->city,
                        'annual_cycle_starts_on' => optional($building->annual_cycle_starts_on)->format('Y-m-d'),
                    ],
                    'stats' => $this->buildingStats($building),
                    'summary' => $summary,
                    'building_owners' => $buildingOwners,
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
