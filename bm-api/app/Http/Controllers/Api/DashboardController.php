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

        $profiles = $this->ownerProfilesForRequest(
            $request,
            ['building', 'apartments', 'payments']
        );

        abort_unless(
            $profiles->isNotEmpty(),
            403,
            'لا توجد بيانات ملكية مرتبطة ببيانات الدخول الحالية.'
        );

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
                    'expenses' => $owner->expenseDues()
                        ->where('building_id', $building->id)
                        ->with(['expense.attachments'])
                        ->latest('id')
                        ->get()
                        ->map(function ($due) {
                            $expense = $due->expense;

                            return [
                                'id' => $expense?->id,
                                'due_id' => $due->id,
                                'category' => $expense?->category,
                                'amount' => (float) ($expense?->amount ?? 0),
                                'expense_date' => $expense?->expense_date,
                                'description' => $expense?->description,
                                'attachments' => $expense?->attachments ?? [],
                                'owner_share' => round((float) $due->amount, 2),
                                'credit_applied' => round((float) ($due->credit_applied ?? 0), 2),
                                'remaining_amount' => round((float) $due->remaining_amount, 2),
                                'auto_confirmed_from_balance' => (bool) ($due->auto_confirmed_from_balance ?? false),
                                'due_status' => $due->status,
                                'payment_method' => $due->payment_method,
                                'payment_date' => $due->payment_date,
                                'owner_notes' => $due->owner_notes,
                                'receipt_url' => $due->receipt_url,
                                'receipt_original_name' => $due->receipt_original_name,
                                'manager_notes' => $due->manager_notes,
                                'submitted_at' => $due->submitted_at,
                                'verified_at' => $due->verified_at,
                            ];
                        })
                        ->values(),
                ];
            })->values(),
        ];
    }
}
