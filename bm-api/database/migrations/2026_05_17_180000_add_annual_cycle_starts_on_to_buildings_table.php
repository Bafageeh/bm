<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('buildings', 'annual_cycle_starts_on')) {
            Schema::table('buildings', function (Blueprint $table) {
                $table->date('annual_cycle_starts_on')->nullable()->after('address');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('buildings', 'annual_cycle_starts_on')) {
            Schema::table('buildings', function (Blueprint $table) {
                $table->dropColumn('annual_cycle_starts_on');
            });
        }
    }
};
