<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Financial tables already exist on the production database.
    }

    public function down(): void
    {
        // No rollback action required for this compatibility migration.
    }
};
