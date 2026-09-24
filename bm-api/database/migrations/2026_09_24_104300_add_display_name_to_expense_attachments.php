<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expense_attachments', function (Blueprint $table) {
            $table->string('display_name', 120)->nullable()->after('original_name');
        });
    }

    public function down(): void
    {
        Schema::table('expense_attachments', function (Blueprint $table) {
            $table->dropColumn('display_name');
        });
    }
};
