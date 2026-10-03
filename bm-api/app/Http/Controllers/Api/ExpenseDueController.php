<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\ExpenseOwnerDue;
use App\Models\UserNotification;
use App\Services\ExpenseNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExpenseDueController extends BaseApiController
{
    public function managerIndex(Request $request, Building $building)
    {
        $this->assertManagerOrAdmin($request, $building);

        $dues = ExpenseOwnerDue::query()
            ->where('building_id', $building->id)
            ->with([
                'owner:id,name,user_id',
                'expense:id,building_id,category,amount,expense_date,description',
            ])
            ->orderByRaw("CASE status WHEN 'submitted' THEN 0 WHEN 'rejected' THEN 1 WHEN 'unpaid' THEN 2 WHEN 'confirmed' THEN 3 ELSE 4 END")
            ->latest('submitted_at')
            ->latest('id')
            ->get();

        return [
            'data' => $dues,
            'counts' => [
                'unpaid' => $dues->where('status', 'unpaid')->count(),
                'submitted' => $dues->where('status', 'submitted')->count(),
                'confirmed' => $dues->where('status', 'confirmed')->count(),
                'rejected' => $dues->where('status', 'rejected')->count(),
            ],
        ];
    }

    public function ownerIndex(Request $request)
    {
        $profiles = $this->ownerProfilesForRequest($request);
        abort_if($profiles->isEmpty(), 403, 'لا توجد ملكية مرتبطة بهذا الحساب.');

        $buildingId = $request->integer('building_id');
        $ownerIds = $profiles
            ->when($buildingId, fn ($items) => $items->where('building_id', $buildingId))
            ->pluck('id')
            ->values();

        abort_if($buildingId && $ownerIds->isEmpty(), 403, 'لا تملك صلاحية الوصول لهذا المبنى.');

        $dues = ExpenseOwnerDue::query()
            ->whereIn('owner_id', $ownerIds)
            ->when($buildingId, fn ($query) => $query->where('building_id', $buildingId))
            ->with([
                'owner:id,name,user_id',
                'expense:id,building_id,category,amount,expense_date,description',
            ])
            ->latest('id')
            ->get();

        return [
            'data' => $dues,
            'counts' => [
                'unpaid' => $dues->where('status', 'unpaid')->count(),
                'submitted' => $dues->where('status', 'submitted')->count(),
                'confirmed' => $dues->where('status', 'confirmed')->count(),
                'rejected' => $dues->where('status', 'rejected')->count(),
            ],
        ];
    }

    public function submit(Request $request, ExpenseOwnerDue $due)
    {
        $profiles = $this->ownerProfilesForRequest($request);
        abort_unless(
            $profiles->contains(fn ($owner) => (int) $owner->id === (int) $due->owner_id),
            403,
            'هذه الفاتورة غير مرتبطة بحسابك.'
        );
        abort_if($due->status === 'confirmed', 422, 'تم اعتماد هذا السداد مسبقًا ولا يمكن تعديله.');

        $data = $request->validate([
            'paid' => ['required', 'boolean'],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'payment_date' => ['nullable', 'date_format:Y-m-d'],
            'owner_notes' => ['nullable', 'string', 'max:2000'],
            'receipt' => ['nullable', 'file', 'max:10240', 'mimetypes:image/jpeg,image/png,image/webp,application/pdf,application/x-pdf'],
        ]);

        if (! $data['paid']) {
            $this->deleteReceipt($due);
            $due->update([
                'status' => 'unpaid',
                'payment_method' => null,
                'payment_date' => null,
                'owner_notes' => $data['owner_notes'] ?? null,
                'receipt_path' => null,
                'receipt_original_name' => null,
                'receipt_mime_type' => null,
                'receipt_token' => null,
                'submitted_at' => null,
                'manager_notes' => null,
                'verified_at' => null,
                'verified_by_user_id' => null,
            ]);

            return ['data' => $due->fresh(['expense', 'owner'])];
        }

        if (blank($data['payment_method'] ?? null)) {
            abort(422, 'اختر طريقة الدفع.');
        }
        if (blank($data['payment_date'] ?? null)) {
            abort(422, 'اختر تاريخ الدفع.');
        }

        $updates = [
            'status' => 'submitted',
            'payment_method' => trim((string) $data['payment_method']),
            'payment_date' => $data['payment_date'],
            'owner_notes' => $data['owner_notes'] ?? null,
            'submitted_at' => now(),
            'manager_notes' => null,
            'verified_at' => null,
            'verified_by_user_id' => null,
        ];

        if ($request->hasFile('receipt')) {
            $this->deleteReceipt($due);
            $file = $request->file('receipt');
            $updates['receipt_path'] = $file->store('expense-due-receipts', 'local');
            $updates['receipt_original_name'] = $file->getClientOriginalName();
            $updates['receipt_mime_type'] = $file->getClientMimeType() ?: $file->getMimeType() ?: 'application/octet-stream';
            $updates['receipt_token'] = Str::random(48);
        }

        $due->update($updates);
        $due->load(['expense', 'owner']);
        $this->notifyManagersOfSubmission($due);

        return ['data' => $due->fresh(['expense', 'owner'])];
    }

    public function verify(Request $request, Building $building, ExpenseOwnerDue $due)
    {
        $this->assertManagerOrAdmin($request, $building);
        abort_unless((int) $due->building_id === (int) $building->id, 404, 'طلب السداد غير موجود في هذا المبنى.');

        $data = $request->validate([
            'decision' => ['required', 'string', 'in:confirmed,rejected'],
            'manager_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        abort_if($due->status === 'unpaid', 422, 'لم يرسل المالك إثبات سداد بعد.');

        DB::transaction(function () use ($due, $data, $request) {
            if ($data['decision'] === 'confirmed') {
                $this->confirmDuePayment($due);
            } else {
                if ($due->owner_payment_id) {
                    $due->payment?->delete();
                }
                $due->owner_payment_id = null;
            }

            $due->status = $data['decision'];
            $due->manager_notes = $data['manager_notes'] ?? null;
            $due->verified_at = now();
            $due->verified_by_user_id = $request->user()->id;
            $due->save();
        });

        $due->load(['expense', 'owner']);
        $this->notifyOwnerOfVerification($due);

        return ['data' => $due->fresh(['expense', 'owner'])];
    }

    public function showReceipt(ExpenseOwnerDue $due, string $token)
    {
        abort_unless($due->receipt_token && hash_equals((string) $due->receipt_token, $token), 404);
        abort_unless($due->receipt_path && Storage::disk('local')->exists($due->receipt_path), 404);

        return response()->file(
            Storage::disk('local')->path($due->receipt_path),
            [
                'Content-Type' => $due->receipt_mime_type ?: 'application/octet-stream',
                'Cache-Control' => 'private, max-age=3600',
            ]
        );
    }

    private function confirmDuePayment(ExpenseOwnerDue $due): void
    {
        $due->loadMissing(['owner', 'expense', 'payment']);

        $payload = [
            'building_id' => $due->building_id,
            'apartment_id' => null,
            'amount' => $due->amount,
            'payment_date' => optional($due->payment_date)->format('Y-m-d') ?: now()->format('Y-m-d'),
            'method' => $due->payment_method,
            'notes' => trim(
                'سداد فاتورة '.($due->expense?->category ?: 'مصروف')
                .' #'.$due->expense_id
                .($due->owner_notes ? ' - '.$due->owner_notes : '')
            ),
        ];

        if ($due->payment) {
            $due->payment->update($payload);
            return;
        }

        $payment = $due->owner->payments()->create($payload);
        $due->owner_payment_id = $payment->id;
    }

    private function deleteReceipt(ExpenseOwnerDue $due): void
    {
        if ($due->receipt_path) {
            Storage::disk('local')->delete($due->receipt_path);
        }
    }

    private function notifyManagersOfSubmission(ExpenseOwnerDue $due): void
    {
        $due->loadMissing(['building.managers', 'owner', 'expense']);

        $managerIds = collect();

        foreach ($due->building->managers as $manager) {
            $managerIds->push($manager->id);
            UserNotification::updateOrCreate(
                [
                    'user_id' => $manager->id,
                    'source_type' => 'expense_due_submission',
                    'source_id' => $due->id,
                ],
                [
                    'building_id' => $due->building_id,
                    'type' => 'expense_payment_submitted',
                    'title' => 'إثبات سداد بانتظار التحقق',
                    'body' => ($due->owner?->name ?: 'مالك').' أرسل إثبات سداد بقيمة '.number_format((float) $due->amount, 2).' ريال.',
                    'data' => [
                        'building_id' => $due->building_id,
                        'due_id' => $due->id,
                        'tab' => 'expenses',
                        'action' => 'review_payment',
                    ],
                    'read_at' => null,
                ]
            );
        }

        app(ExpenseNotificationService::class)->pushToUsers(
            $managerIds,
            'إثبات سداد بانتظار التحقق',
            ($due->owner?->name ?: 'مالك').' أرسل إثبات سداد بقيمة '.number_format((float) $due->amount, 2).' ريال.',
            [
                'type' => 'expense_payment_submitted',
                'building_id' => $due->building_id,
                'due_id' => $due->id,
                'tab' => 'expenses',
            ]
        );
    }

    private function notifyOwnerOfVerification(ExpenseOwnerDue $due): void
    {
        $userId = $due->owner?->user_id;
        if (! $userId) {
            return;
        }

        $confirmed = $due->status === 'confirmed';
        UserNotification::create([
            'user_id' => $userId,
            'building_id' => $due->building_id,
            'source_type' => 'expense_due_verification',
            'source_id' => $due->id,
            'type' => $confirmed ? 'expense_payment_confirmed' : 'expense_payment_rejected',
            'title' => $confirmed ? 'تم توثيق السداد' : 'لم يتم تأكيد وصول المبلغ',
            'body' => $confirmed
                ? 'تم تأكيد استلام مبلغ '.number_format((float) $due->amount, 2).' ريال.'
                : 'لم يتم تأكيد وصول مبلغ '.number_format((float) $due->amount, 2).' ريال. '.trim((string) $due->manager_notes),
            'data' => [
                'building_id' => $due->building_id,
                'due_id' => $due->id,
                'tab' => 'expenses',
                'action' => 'expense_due',
            ],
        ]);

        app(ExpenseNotificationService::class)->pushToUsers(
            [$userId],
            $confirmed ? 'تم توثيق السداد' : 'لم يتم تأكيد وصول المبلغ',
            $confirmed
                ? 'تم تأكيد استلام مبلغ '.number_format((float) $due->amount, 2).' ريال.'
                : 'راجع فاتورتك وأعد إرسال بيانات السداد بعد التحقق من التحويل.',
            [
                'type' => $confirmed ? 'expense_payment_confirmed' : 'expense_payment_rejected',
                'building_id' => $due->building_id,
                'due_id' => $due->id,
                'tab' => 'expenses',
            ]
        );
    }
}
