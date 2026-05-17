<?php

namespace Database\Seeders;

use App\Models\Building;
use App\Models\Expense;
use App\Models\Owner;
use App\Models\OwnerPayment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'مدير التطبيق',
                'email' => 'admin@bm.local',
                'role' => 'admin',
                'status' => 'active',
                'password' => Hash::make('123456'),
            ]
        );

        $manager = User::firstOrCreate(
            ['username' => 'manager'],
            [
                'name' => 'مدير المبنى',
                'email' => 'manager@bm.local',
                'role' => 'manager',
                'status' => 'active',
                'password' => Hash::make('123456'),
            ]
        );

        $building = Building::firstOrCreate(
            ['name' => 'عمارة التجربة'],
            ['city' => 'جدة', 'district' => 'الصفا', 'status' => 'active']
        );

        $building->managers()->syncWithoutDetaching([$manager->id => ['role' => 'manager']]);

        if ($building->owners()->count() === 0) {
            $ownerUser = User::create([
                'name' => 'مالك تجربة',
                'username' => 'owner',
                'email' => 'owner@bm.local',
                'role' => 'owner',
                'status' => 'active',
                'password' => Hash::make('123456'),
            ]);

            $owner = Owner::create([
                'building_id' => $building->id,
                'user_id' => $ownerUser->id,
                'name' => 'مالك تجربة',
                'phone' => '0500000000',
                'status' => 'active',
            ]);

            foreach (range(1, 17) as $number) {
                $building->apartments()->create([
                    'owner_id' => $number === 1 ? $owner->id : null,
                    'number' => (string) $number,
                    'floor' => (string) ceil($number / 4),
                    'status' => 'active',
                ]);
            }

            Expense::create([
                'building_id' => $building->id,
                'category' => 'صيانة',
                'amount' => 17000,
                'expense_date' => now()->toDateString(),
                'description' => 'مصروف تجربة يوضح أن نصيب الشقة الواحدة 1000 ريال عند وجود 17 شقة.',
            ]);

            OwnerPayment::create([
                'building_id' => $building->id,
                'owner_id' => $owner->id,
                'amount' => 1000,
                'payment_date' => now()->toDateString(),
                'method' => 'تحويل',
                'notes' => 'دفعة تجربة',
            ]);
        }
    }
}
