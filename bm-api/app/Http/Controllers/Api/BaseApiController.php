<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Building;
use App\Models\Owner;
use App\Models\User;
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

        if ($user->managedBuildings()->whereKey($building->id)->exists()) {
            return;
        }

        if ($this->ownerProfilesForRequest($request)->contains(fn ($owner) => (int) $owner->building_id === (int) $building->id)) {
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

        if ($user->managedBuildings()->whereKey($building->id)->exists()) {
            return;
        }

        throw new AccessDeniedHttpException('هذه العملية متاحة لمدير المبنى فقط.');
    }

    protected function requestLoginIdentity(Request $request): array
    {
        $tokenName = (string) ($request->user()?->currentAccessToken()?->name ?? '');

        if (str_starts_with($tokenName, 'bm-mobile|')) {
            $parts = explode('|', $tokenName, 3);

            if (count($parts) === 3) {
                $decoded = base64_decode(strtr($parts[2], '-_', '+/'), true);

                if ($decoded !== false && $decoded !== '') {
                    return [
                        'type' => $parts[1],
                        'value' => $decoded,
                    ];
                }
            }
        }

        $user = $request->user();

        return [
            'type' => 'user',
            'value' => (string) ($user?->username ?: $user?->phone ?: $user?->email ?: ''),
        ];
    }

    protected function ownerProfilesForRequest(Request $request, array $with = [])
    {
        $identity = $this->requestLoginIdentity($request);

        return $this->ownerProfilesForIdentity(
            $request->user(),
            $identity['type'] ?? null,
            $identity['value'] ?? null,
            $with
        );
    }

    protected function ownerProfilesForIdentity(User $user, ?string $type, ?string $value, array $with = [])
    {
        $value = trim((string) ($value ?? ''));
        $query = Owner::query();

        if ($with) {
            $query->with($with);
        }

        if ($value !== '') {
            if ($type === 'phone') {
                $query->where('phone', $value);
            } elseif ($type === 'national_id') {
                $query->where('national_id', $value);
            } elseif ($type === 'username') {
                $query->where(function ($ownerQuery) use ($value) {
                    $ownerQuery
                        ->where('national_id', $value)
                        ->orWhereHas('user', fn ($userQuery) => $userQuery->where('username', $value));
                });
            } elseif ($type === 'email') {
                $query->where(function ($ownerQuery) use ($value) {
                    $ownerQuery
                        ->where('email', $value)
                        ->orWhereHas('user', fn ($userQuery) => $userQuery->where('email', $value));
                });
            } else {
                $query->where(function ($ownerQuery) use ($user, $value) {
                    $ownerQuery
                        ->where('user_id', $user->id)
                        ->orWhere('national_id', $value)
                        ->orWhere('phone', $value)
                        ->orWhereHas('user', fn ($userQuery) => $userQuery->where('username', $value));
                });
            }

            return $query->get();
        }

        $nationalIds = $user->ownerProfiles()
            ->whereNotNull('national_id')
            ->pluck('national_id')
            ->map(fn ($item) => trim((string) $item))
            ->filter()
            ->unique()
            ->values();

        return $query
            ->when(
                $nationalIds->isNotEmpty(),
                fn ($ownerQuery) => $ownerQuery->whereIn('national_id', $nationalIds->all()),
                fn ($ownerQuery) => $ownerQuery->where('user_id', $user->id)
            )
            ->get();
    }

    protected function buildingStats(Building $building): array
    {
        $actualApartmentCount = $building->apartments()->count();
        $totalExpenses = (float) $building->expenses()->sum('amount');
        $totalPayments = (float) $building->payments()->sum('amount');
        $sharePerApartment = $actualApartmentCount > 0 ? $totalExpenses / $actualApartmentCount : 0;
        $unassignedApartmentNumbers = $building->apartments()
            ->whereNull('owner_id')
            ->orderByRaw('CAST(number AS UNSIGNED), number')
            ->pluck('number')
            ->values();
        $unassignedApartmentCount = $unassignedApartmentNumbers->count();
        $unassignedApartmentAmount = $sharePerApartment * $unassignedApartmentCount;

        return [
            'apartment_count' => $actualApartmentCount,
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
