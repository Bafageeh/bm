<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('expenses') && ! Schema::hasColumn('expenses', 'scope')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->string('scope')->default('all')->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('expenses') && Schema::hasColumn('expenses', 'scope')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->dropColumn('scope');
            });
        }
    }
};
