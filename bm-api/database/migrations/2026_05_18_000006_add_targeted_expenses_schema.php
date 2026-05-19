<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            if (! Schema::hasColumn('expenses', 'scope')) {
                $table->string('scope')->default('all')->index()->after('attachment_path');
            }
        });

        if (! Schema::hasTable('expense_owner')) {
            Schema::create('expense_owner', function (Blueprint $table) {
                $table->id();
                $table->foreignId('expense_id')->constrained()->cascadeOnDelete();
                $table->foreignId('owner_id')->constrained()->cascadeOnDelete();
                $table->decimal('share_amount', 12, 2)->nullable();
                $table->timestamps();
                $table->unique(['expense_id', 'owner_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_owner');

        Schema::table('expenses', function (Blueprint $table) {
            if (Schema::hasColumn('expenses', 'scope')) {
                $table->dropColumn('scope');
            }
        });
    }
};
