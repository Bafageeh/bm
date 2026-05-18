<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UpdateUsernameSeeder extends Seeder
{
    public function run(): void
    {
        User::query()
            ->where('username', '10000000')
            ->update(['username' => '1234']);
    }
}
