<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('expense_categories')) {
            return;
        }

        if (! Schema::hasColumn('expense_categories', 'notes')) {
            Schema::table('expense_categories', function (Blueprint $table) {
                $table->text('notes')->nullable()->after('name');
            });
        }

        if (! Schema::hasColumn('expense_categories', 'is_active')) {
            Schema::table('expense_categories', function (Blueprint $table) {
                $table->boolean('is_active')->default(false)->after('notes');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('expense_categories')) {
            return;
        }

        Schema::table('expense_categories', function (Blueprint $table) {
            if (Schema::hasColumn('expense_categories', 'is_active')) {
                $table->dropColumn('is_active');
            }
            if (Schema::hasColumn('expense_categories', 'notes')) {
                $table->dropColumn('notes');
            }
        });
    }
};
