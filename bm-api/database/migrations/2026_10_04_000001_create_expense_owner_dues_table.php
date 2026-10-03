<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('expense_owner_dues')) {
            Schema::create('expense_owner_dues', function (Blueprint $table) {
                $table->id();
                $table->foreignId('expense_id')->constrained()->cascadeOnDelete();
                $table->foreignId('building_id')->constrained()->cascadeOnDelete();
                $table->foreignId('owner_id')->constrained()->cascadeOnDelete();
                $table->decimal('amount', 12, 2);
                $table->string('status', 30)->default('unpaid')->index();
                $table->string('payment_method', 100)->nullable();
                $table->date('payment_date')->nullable();
                $table->text('owner_notes')->nullable();
                $table->string('receipt_path')->nullable();
                $table->string('receipt_original_name')->nullable();
                $table->string('receipt_mime_type')->nullable();
                $table->string('receipt_token', 64)->nullable()->unique();
                $table->timestamp('submitted_at')->nullable();
                $table->timestamp('verified_at')->nullable();
                $table->unsignedBigInteger('verified_by_user_id')->nullable()->index();
                $table->text('manager_notes')->nullable();
                $table->unsignedBigInteger('owner_payment_id')->nullable()->index();
                $table->timestamps();

                $table->unique(['expense_id', 'owner_id']);
                $table->index(['building_id', 'status']);
                $table->index(['owner_id', 'status']);
            });
        }

        $this->backfillExistingExpenses();
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_owner_dues');
    }

    private function backfillExistingExpenses(): void
    {
        if (! Schema::hasTable('expenses') || ! Schema::hasTable('owners')) {
            return;
        }

        DB::table('expenses')
            ->orderBy('id')
            ->chunkById(100, function ($expenses) {
                foreach ($expenses as $expense) {
                    if (DB::table('expense_owner_dues')->where('expense_id', $expense->id)->exists()) {
                        continue;
                    }

                    $scope = property_exists($expense, 'scope') ? ($expense->scope ?: 'all') : 'all';
                    if ($scope === 'selected' && Schema::hasTable('expense_owner')) {
                        $rows = DB::table('expense_owner')
                            ->where('expense_id', $expense->id)
                            ->get(['owner_id', 'share_amount']);

                        foreach ($rows as $row) {
                            DB::table('expense_owner_dues')->insert([
                                'expense_id' => $expense->id,
                                'building_id' => $expense->building_id,
                                'owner_id' => $row->owner_id,
                                'amount' => (float) ($row->share_amount ?? 0),
                                'status' => 'unpaid',
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }

                        continue;
                    }

                    $owners = DB::table('owners')
                        ->where('building_id', $expense->building_id)
                        ->get(['id']);
                    if ($owners->isEmpty()) {
                        continue;
                    }

                    $apartmentCounts = Schema::hasTable('apartments')
                        ? DB::table('apartments')
                            ->where('building_id', $expense->building_id)
                            ->whereNotNull('owner_id')
                            ->select('owner_id', DB::raw('COUNT(*) as apartments_count'))
                            ->groupBy('owner_id')
                            ->pluck('apartments_count', 'owner_id')
                        : collect();

                    $totalApartments = (int) $apartmentCounts->sum();
                    $eligibleOwners = $totalApartments > 0
                        ? $owners->filter(fn ($owner) => (int) ($apartmentCounts[$owner->id] ?? 0) > 0)->values()
                        : $owners->values();

                    $remaining = round((float) $expense->amount, 2);
                    foreach ($eligibleOwners as $index => $owner) {
                        $amount = $index === $eligibleOwners->count() - 1
                            ? $remaining
                            : ($totalApartments > 0
                                ? round(((float) $expense->amount / $totalApartments) * (int) ($apartmentCounts[$owner->id] ?? 0), 2)
                                : floor((((float) $expense->amount / max(1, $eligibleOwners->count())) * 100)) / 100);

                        if ($amount <= 0) {
                            continue;
                        }

                        DB::table('expense_owner_dues')->insert([
                            'expense_id' => $expense->id,
                            'building_id' => $expense->building_id,
                            'owner_id' => $owner->id,
                            'amount' => $amount,
                            'status' => 'unpaid',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        $remaining = round($remaining - $amount, 2);
                    }
                }
            });
    }
};
