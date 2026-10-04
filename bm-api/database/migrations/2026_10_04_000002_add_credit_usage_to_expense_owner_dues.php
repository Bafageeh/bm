<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expense_owner_dues', function (Blueprint $table) {
            if (! Schema::hasColumn('expense_owner_dues', 'credit_applied')) {
                $table->decimal('credit_applied', 12, 2)->default(0)->after('amount');
            }
            if (! Schema::hasColumn('expense_owner_dues', 'auto_confirmed_from_balance')) {
                $table->boolean('auto_confirmed_from_balance')->default(false)->after('credit_applied')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('expense_owner_dues', function (Blueprint $table) {
            if (Schema::hasColumn('expense_owner_dues', 'auto_confirmed_from_balance')) {
                $table->dropColumn('auto_confirmed_from_balance');
            }
            if (Schema::hasColumn('expense_owner_dues', 'credit_applied')) {
                $table->dropColumn('credit_applied');
            }
        });
    }
};
