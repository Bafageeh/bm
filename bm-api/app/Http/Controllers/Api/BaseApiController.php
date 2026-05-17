<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Building;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

abstract class BaseApiController extends Controller
{
    protected function assertCanAccessBuilding(Request $request, Building $building): void
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return;
        }

        if ($user->isManager() && $user->managedBuildings()->whereKey($building->id)->exists()) {
            return;
        }

        if ($user->isOwner() && $user->ownerProfiles()->where('building_id', $building->id)->exists()) {
            return;
        }

        throw new AccessDeniedHttpException('لا تملك صلاحية الوصول لهذا المبنى.');
    }

    protected function assertManagerOrAdmin(Request $request, Building $building): void
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return;
        }

        if ($user->isManager() && $user->managedBuildings()->whereKey($building->id)->exists()) {
            return;
        }

        throw new AccessDeniedHttpException('هذه العملية متاحة لمدير المبنى فقط.');
    }

    protected function buildingStats(Building $building): array
    {
        $actualApartmentCount = $building->apartments()->count();
        $apartmentCount = max(1, $actualApartmentCount);
        $totalExpenses = (float) $building->expenses()->sum('amount');
        $totalPayments = (float) $building->payments()->sum('amount');
        $sharePerApartment = $totalExpenses / $apartmentCount;
        $unassignedApartmentNumbers = $building->apartments()
            ->whereNull('owner_id')
            ->orderByRaw('CAST(number AS UNSIGNED), number')
            ->pluck('number')
            ->values();
        $unassignedApartmentCount = $unassignedApartmentNumbers->count();
        $unassignedApartmentAmount = $sharePerApartment * $unassignedApartmentCount;

        return [
            'apartment_count' => $apartmentCount,
            'actual_apartment_count' => $actualApartmentCount,
            'total_expenses' => round($totalExpenses, 2),
            'total_payments' => round($totalPayments, 2),
            'building_balance' => round($totalPayments - $totalExpenses, 2),
            'share_per_apartment' => round($sharePerApartment, 2),
            'unassigned_apartment_count' => $unassignedApartmentCount,
            'unassigned_apartment_amount' => round($unassignedApartmentAmount, 2),
            'unassigned_apartments' => $unassignedApartmentNumbers,
        ];
    }

    protected function ownerSummary(Building $building, $owner): array
    {
        $stats = $this->buildingStats($building);
        $apartmentCount = $owner->apartments()->count();
        $ownerShare = $stats['share_per_apartment'] * $apartmentCount;
        $payments = (float) $owner->payments()->sum('amount');
        $balance = $payments - $ownerShare;
        $unpaidAmount = max(0, $ownerShare - $payments);

        return [
            'id' => $owner->id,
            'name' => $owner->name,
            'national_id' => $owner->national_id,
            'phone' => $owner->phone,
            'email' => $owner->email,
            'notes' => $owner->notes,
            'user_id' => $owner->user_id,
            'login' => $owner->national_id ?: ($owner->phone ?: ($owner->email ?: $owner->user?->username)),
            'apartment_count' => $apartmentCount,
            'apartments' => $owner->apartments()->orderByRaw('CAST(number AS UNSIGNED), number')->pluck('number'),
            'total_payments' => round($payments, 2),
            'expense_share' => round($ownerShare, 2),
            'unpaid_amount' => round($unpaidAmount, 2),
            'balance' => round($balance, 2),
            'status' => $balance > 0 ? 'surplus' : ($balance < 0 ? 'due' : 'balanced'),
        ];
    }
}
