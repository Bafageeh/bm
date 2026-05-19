<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('expenses')) {
            Schema::create('expenses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('building_id')->constrained()->cascadeOnDelete();
                $table->string('category')->index();
                $table->decimal('amount', 12, 2);
                $table->date('expense_date');
                $table->text('description')->nullable();
                $table->string('attachment_path')->nullable();
                $table->string('scope')->default('all')->index();
                $table->timestamps();
                $table->index(['building_id', 'expense_date']);
            });
        } elseif (! Schema::hasColumn('expenses', 'scope')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->string('scope')->default('all')->index();
            });
        }

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

        if (! Schema::hasTable('owner_payments')) {
            Schema::create('owner_payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('building_id')->constrained()->cascadeOnDelete();
                $table->foreignId('owner_id')->constrained()->cascadeOnDelete();
                $table->decimal('amount', 12, 2);
                $table->date('payment_date');
                $table->string('method')->nullable();
                $table->text('notes')->nullable();
                $table->string('attachment_path')->nullable();
                $table->timestamps();
                $table->index(['building_id', 'payment_date']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('owner_payments');
        Schema::dropIfExists('expense_owner');
        Schema::dropIfExists('expenses');
    }
};
