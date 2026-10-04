<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\Expense;
use App\Models\ExpenseOwnerDue;
use App\Models\UserNotification;
use App\Services\ExpenseNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ExpenseController extends BaseApiController
{
    public function index(Request $request, Building $building)
    {
        $this->assertCanAccessBuilding($request, $building);

        $query = $building->expenses()
            ->with('attachments')
            ->latest('expense_date')
            ->latest('id');

        if (Schema::hasTable('expense_owner')) {
            $query->with(['owners:id,name']);
        }

        if (Schema::hasTable('expense_owner_dues')) {
            $query->with(['dues.owner:id,name,user_id']);
        }

        return ['data' => $query->get()];
    }

    public function store(Request $request, Building $building)
    {
        $this->assertManagerOrAdmin($request, $building);

        $data = $this->validatedData($request, $building);
        $ownerIds = $data['owner_ids'] ?? [];
        unset($data['owner_ids']);
        $data = $this->prepareExpenseDataForStorage($data);

        [$expense, $dues] = DB::transaction(function () use ($building, $data, $ownerIds) {
            $expense = $building->expenses()->create($data);
            $this->syncTargetOwners($expense, $ownerIds);
            $dues = $this->syncDues($building, $expense, $ownerIds);

            return [$expense, $dues];
        });

        $freshExpense = $this->freshExpense($expense);
        $this->notifyDueOwners($building, $freshExpense, $dues, 'created');

        if (($freshExpense->scope ?? 'all') !== 'selected') {
            app(ExpenseNotificationService::class)->queueForManager(
                $building,
                $request->user(),
                'expense_created',
                'تمت إضافة مصروف من نوع '.$freshExpense->category.' بقيمة '.number_format((float) $freshExpense->amount, 2).' ريال.'
            );
        }

        return response()->json(['data' => $freshExpense], 201);
    }

    public function update(Request $request, Building $building, Expense $expense)
    {
        $this->assertManagerOrAdmin($request, $building);
        $this->assertExpenseBelongsToBuilding($building, $expense);

        $data = $this->validatedData($request, $building);
        $ownerIds = $data['owner_ids'] ?? [];
        unset($data['owner_ids']);
        $data = $this->prepareExpenseDataForStorage($data);

        $dues = DB::transaction(function () use ($building, $expense, $data, $ownerIds) {
            $expense->update($data);
            $this->syncTargetOwners($expense, $ownerIds);

            return $this->syncDues($building, $expense, $ownerIds);
        });

        $freshExpense = $this->freshExpense($expense);
        $this->notifyDueOwners($building, $freshExpense, $dues, 'updated');

        if (($freshExpense->scope ?? 'all') !== 'selected') {
            app(ExpenseNotificationService::class)->queueForManager(
                $building,
                $request->user(),
                'expense_updated',
                'تم تعديل مصروف من نوع '.$freshExpense->category.' بقيمة '.number_format((float) $freshExpense->amount, 2).' ريال.'
            );
        }

        return ['data' => $freshExpense];
    }

    public function destroy(Request $request, Building $building, Expense $expense)
    {
        $this->assertManagerOrAdmin($request, $building);
        $this->assertExpenseBelongsToBuilding($building, $expense);

        DB::transaction(function () use ($expense) {
            if (Schema::hasTable('expense_owner_dues')) {
                $expense->dues()->with('payment')->get()->each(function (ExpenseOwnerDue $due) {
                    if ($due->payment) {
                        $due->payment->delete();
                    }
                    $due->delete();
                });
            }

            $expense->load('attachments');
            foreach ($expense->attachments as $attachment) {
                $attachment->delete();
            }

            $expense->delete();
        });

        return response()->json(['message' => 'تم حذف المصروف']);
    }

    private function validatedData(Request $request, Building $building): array
    {
        $data = $request->validate([
            'category' => ['required', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date_format:Y-m-d'],
            'description' => ['nullable', 'string'],
            'scope' => ['nullable', 'string', 'in:all,selected'],
            'owner_ids' => ['nullable', 'array'],
            'owner_ids.*' => ['integer'],
        ]);

        $data['expense_date'] = substr((string) $data['expense_date'], 0, 10);
        $data['scope'] = $data['scope'] ?? 'all';

        if ($data['scope'] === 'selected') {
            $ownerIds = collect($data['owner_ids'] ?? [])->map(fn ($id) => (int) $id)->unique()->values();
            abort_if($ownerIds->isEmpty(), 422, 'اختر مالكًا واحدًا على الأقل للمصروف المخصص');

            $validCount = $building->owners()->whereIn('id', $ownerIds)->count();
            abort_if($validCount !== $ownerIds->count(), 422, 'يوجد مالك غير تابع لهذا المبنى');

            $data['owner_ids'] = $ownerIds->all();
        } else {
            $data['scope'] = 'all';
            $data['owner_ids'] = [];
        }

        return $data;
    }

    private function prepareExpenseDataForStorage(array $data): array
    {
        if (! Schema::hasColumn('expenses', 'scope')) {
            unset($data['scope']);
        }

        return $data;
    }

    private function syncTargetOwners(Expense $expense, array $ownerIds): void
    {
        if (! Schema::hasTable('expense_owner')) {
            return;
        }

        if (! Schema::hasColumn('expenses', 'scope') || $expense->scope !== 'selected') {
            $expense->owners()->detach();
            return;
        }

        $shares = $this->equalAllocations((float) $expense->amount, $ownerIds);
        $sync = collect($ownerIds)
            ->mapWithKeys(fn ($ownerId) => [$ownerId => ['share_amount' => $shares[(int) $ownerId] ?? 0]])
            ->all();

        $expense->owners()->sync($sync);
    }

    private function syncDues(Building $building, Expense $expense, array $ownerIds): Collection
    {
        if (! Schema::hasTable('expense_owner_dues')) {
            return collect();
        }

        $allocations = $this->dueAllocations($building, $expense, $ownerIds);
        $targetOwnerIds = collect(array_keys($allocations))->map(fn ($id) => (int) $id)->values();

        $removed = $expense->dues()
            ->when($targetOwnerIds->isNotEmpty(), fn ($query) => $query->whereNotIn('owner_id', $targetOwnerIds))
            ->when($targetOwnerIds->isEmpty(), fn ($query) => $query)
            ->with('payment')
            ->get();

        foreach ($removed as $due) {
            if ($due->payment) {
                $due->payment->delete();
            }
            $due->delete();
        }

        foreach ($allocations as $ownerId => $share) {
            $due = ExpenseOwnerDue::firstOrNew([
                'expense_id' => $expense->id,
                'owner_id' => (int) $ownerId,
            ]);

            $due->loadMissing('payment');

            $previousBalance = $this->availablePriorBalance(
                $building,
                (int) $ownerId,
                $expense->id,
                $due->owner_payment_id
            );
            $creditApplied = round(min((float) $share, max(0, $previousBalance)), 2);
            $remainingAmount = round(max(0, (float) $share - $creditApplied), 2);

            $wasAutoConfirmed = (bool) ($due->auto_confirmed_from_balance ?? false);
            $due->building_id = $building->id;
            $due->amount = $share;
            $due->credit_applied = $creditApplied;

            if ($remainingAmount <= 0.009) {
                if (! $due->payment) {
                    $due->status = 'confirmed';
                    $due->auto_confirmed_from_balance = true;
                    $due->payment_method = 'رصيد سابق';
                    $due->payment_date = optional($expense->expense_date)->format('Y-m-d') ?: now()->format('Y-m-d');
                    $due->submitted_at = null;
                    $due->verified_at = now();
                    $due->verified_by_user_id = null;
                    $due->manager_notes = 'تم تأكيد السداد تلقائيًا باستخدام الرصيد السابق.';
                }
            } else {
                $due->auto_confirmed_from_balance = false;

                if (! $due->exists || $wasAutoConfirmed) {
                    $due->status = 'unpaid';
                    $due->payment_method = null;
                    $due->payment_date = null;
                    $due->submitted_at = null;
                    $due->verified_at = null;
                    $due->verified_by_user_id = null;
                    $due->manager_notes = null;
                }

                if ($due->status === 'confirmed' && $due->payment) {
                    $due->payment->update(['amount' => $remainingAmount]);
                }
            }

            if (! $due->exists && $remainingAmount > 0.009) {
                $due->status = 'unpaid';
            }

            $due->save();
        }

        return $expense->dues()->with(['owner:id,name,user_id', 'expense'])->get();
    }

    private function availablePriorBalance(Building $building, int $ownerId, int $currentExpenseId, ?int $currentPaymentId = null): float
    {
        $payments = DB::table('owner_payments')
            ->where('building_id', $building->id)
            ->where('owner_id', $ownerId)
            ->when($currentPaymentId, fn ($query) => $query->where('id', '!=', $currentPaymentId))
            ->sum('amount');

        $otherDues = ExpenseOwnerDue::query()
            ->where('building_id', $building->id)
            ->where('owner_id', $ownerId)
            ->where('expense_id', '!=', $currentExpenseId)
            ->sum('amount');

        return round(max(0, (float) $payments - (float) $otherDues), 2);
    }

    private function dueAllocations(Building $building, Expense $expense, array $ownerIds): array
    {
        if (($expense->scope ?? 'all') === 'selected') {
            return $this->equalAllocations((float) $expense->amount, $ownerIds);
        }

        $owners = $building->owners()->withCount('apartments')->orderBy('id')->get();
        if ($owners->isEmpty()) {
            return [];
        }

        $ownersWithApartments = $owners->filter(fn ($owner) => (int) $owner->apartments_count > 0)->values();
        $totalOwnedApartments = (int) $ownersWithApartments->sum('apartments_count');
        if ($totalOwnedApartments <= 0) {
            return $this->equalAllocations((float) $expense->amount, $owners->pluck('id')->all());
        }

        $allocations = [];
        $remaining = round((float) $expense->amount, 2);
        foreach ($ownersWithApartments as $index => $owner) {
            $share = $index === $ownersWithApartments->count() - 1
                ? $remaining
                : round(((float) $expense->amount / $totalOwnedApartments) * (int) $owner->apartments_count, 2);

            $allocations[(int) $owner->id] = $share;
            $remaining = round($remaining - $share, 2);
        }

        return $allocations;
    }

    private function equalAllocations(float $amount, array $ownerIds): array
    {
        $ids = collect($ownerIds)->map(fn ($id) => (int) $id)->unique()->values();
        if ($ids->isEmpty()) {
            return [];
        }

        $base = floor(($amount / $ids->count()) * 100) / 100;
        $remaining = round($amount - ($base * $ids->count()), 2);
        $allocations = [];

        foreach ($ids as $index => $ownerId) {
            $share = $base;
            if ($index === $ids->count() - 1) {
                $share = round($share + $remaining, 2);
            }
            $allocations[$ownerId] = $share;
        }

        return $allocations;
    }

    private function notifyDueOwners(Building $building, Expense $expense, Collection $dues, string $event): void
    {
        foreach ($dues as $due) {
            $userId = $due->owner?->user_id;
            if (! $userId) {
                continue;
            }

            $share = (float) $due->amount;
            $credit = (float) ($due->credit_applied ?? 0);
            $remaining = (float) $due->remaining_amount;

            if ($due->auto_confirmed_from_balance && $remaining <= 0.009) {
                $title = 'تم السداد من رصيدك السابق';
                $body = 'تم استخدام '.number_format($credit, 2).' ريال من رصيدك السابق لتغطية نصيبك من '.$expense->category.'، وتم تأكيد السداد تلقائيًا.';
                $type = 'expense_paid_from_balance';
                $action = 'expense_due';
            } elseif ($credit > 0.009) {
                $title = 'تم استخدام جزء من رصيدك';
                $body = 'نصيبك من '.$expense->category.' هو '.number_format($share, 2).' ريال. تم استخدام '.number_format($credit, 2).' ريال من رصيدك السابق، والمتبقي عليك '.number_format($remaining, 2).' ريال.';
                $type = 'expense_due';
                $action = 'expense_due';
            } else {
                $title = $event === 'updated' ? 'تم تحديث فاتورة مستحقة عليك' : 'فاتورة جديدة مستحقة عليك';
                $body = 'نصيبك من '.$expense->category.' هو '.number_format($share, 2).' ريال. اضغط لفتح شاشة السداد.';
                $type = 'expense_due';
                $action = 'expense_due';
            }

            UserNotification::updateOrCreate(
                [
                    'user_id' => $userId,
                    'source_type' => 'expense_owner_due',
                    'source_id' => $due->id,
                ],
                [
                    'building_id' => $building->id,
                    'type' => $type,
                    'title' => $title,
                    'body' => $body,
                    'data' => [
                        'building_id' => $building->id,
                        'expense_id' => $expense->id,
                        'due_id' => $due->id,
                        'tab' => 'expenses',
                        'action' => $action,
                    ],
                    'read_at' => null,
                ]
            );

            app(ExpenseNotificationService::class)->pushToUsers(
                [$userId],
                $title,
                $body,
                [
                    'type' => $type,
                    'building_id' => $building->id,
                    'due_id' => $due->id,
                    'tab' => 'expenses',
                ]
            );
        }
    }

    private function freshExpense(Expense $expense): Expense
    {
        $relations = ['attachments'];

        if (Schema::hasTable('expense_owner')) {
            $relations[] = 'owners:id,name';
        }
        if (Schema::hasTable('expense_owner_dues')) {
            $relations[] = 'dues.owner:id,name,user_id';
        }

        return $expense->fresh($relations);
    }

    private function assertExpenseBelongsToBuilding(Building $building, Expense $expense): void
    {
        abort_unless((int) $expense->building_id === (int) $building->id, 404, 'المصروف غير موجود في هذا المبنى');
    }
}
