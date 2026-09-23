<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('owner_payments') || Schema::hasColumn('owner_payments', 'apartment_id')) {
            return;
        }

        Schema::table('owner_payments', function (Blueprint $table) {
            $table->foreignId('apartment_id')
                ->nullable()
                ->after('owner_id')
                ->constrained('apartments')
                ->nullOnDelete()
                ->index();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('owner_payments') || ! Schema::hasColumn('owner_payments', 'apartment_id')) {
            return;
        }

        Schema::table('owner_payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('apartment_id');
        });
    }
};
