<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends BaseApiController
{
    public function index(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isAdmin(), 403, 'هذه الشاشة متاحة لمدير التطبيق فقط.');

        $allBuildings = Building::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        $users = User::query()
            ->with([
                'managedBuildings:id,name',
                'ownerProfiles.building:id,name',
            ])
            ->orderByRaw("CASE role WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 WHEN 'owner' THEN 3 ELSE 4 END")
            ->orderBy('name')
            ->get()
            ->map(function (User $account) use ($allBuildings) {
                $buildings = match ($account->role) {
                    'admin' => $allBuildings,
                    'manager' => $account->managedBuildings->map(fn ($building) => [
                        'id' => $building->id,
                        'name' => $building->name,
                    ])->values(),
                    'owner' => $account->ownerProfiles
                        ->pluck('building')
                        ->filter()
                        ->unique('id')
                        ->map(fn ($building) => [
                            'id' => $building->id,
                            'name' => $building->name,
                        ])
                        ->values(),
                    default => collect(),
                };

                return [
                    'id' => $account->id,
                    'name' => $account->name,
                    'username' => $account->username,
                    'phone' => $account->phone,
                    'email' => $account->email,
                    'role' => $account->role,
                    'status' => $account->status,
                    'buildings' => $buildings,
                    'permissions' => $this->permissionsForRole($account->role),
                ];
            })
            ->values();

        return ['data' => $users];
    }

    private function permissionsForRole(?string $role): array
    {
        return match ($role) {
            'admin' => [
                'إدارة جميع المباني',
                'إدارة المستخدمين والصلاحيات',
                'إدارة الملاك',
                'إدارة المصروفات والدفعات',
                'إعدادات النظام والمباني',
            ],
            'manager' => [
                'إدارة المباني المرتبطة به',
                'إدارة الملاك',
                'إدارة المصروفات والدفعات',
                'إعدادات المبنى',
            ],
            'owner' => [
                'عرض الإحصائيات',
                'عرض الملاك',
                'عرض المصروفات',
                'إدارة معلومات حسابه والرقم السري',
            ],
            default => [],
        };
    }
}
