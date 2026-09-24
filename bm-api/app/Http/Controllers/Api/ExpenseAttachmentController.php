<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\Expense;
use App\Models\ExpenseAttachment;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExpenseAttachmentController extends BaseApiController
{
    public function store(Request $request, Building $building, Expense $expense)
    {
        $this->assertManagerOrAdmin($request, $building);
        $this->assertExpenseBelongsToBuilding($building, $expense);

        $request->validate([
            'attachments' => ['required', 'array', 'min:1', 'max:2'],
            'attachments.*' => ['required', 'file', 'max:10240', 'mimetypes:image/jpeg,image/png,image/webp,application/pdf,application/x-pdf'],
            'display_names' => ['nullable', 'array', 'max:2'],
            'display_names.*' => ['nullable', 'string', 'max:120'],
        ]);

        $files = collect($request->file('attachments', []));
        $existing = $expense->attachments()->get();

        $incomingPdfCount = $files->filter(fn (UploadedFile $file) => $this->isPdf($file))->count();
        $incomingImageCount = $files->count() - $incomingPdfCount;
        $existingPdfCount = $existing->filter(fn (ExpenseAttachment $attachment) => $this->attachmentIsPdf($attachment))->count();
        $existingImageCount = $existing->count() - $existingPdfCount;

        abort_if($incomingPdfCount > 0 && $incomingImageCount > 0, 422, 'يمكن إرفاق صورتين أو ملف PDF واحد فقط، ولا يمكن الجمع بينهما.');
        abort_if($existingPdfCount > 0 && $files->isNotEmpty(), 422, 'يوجد ملف PDF مرفق بالفعل بهذا المصروف.');
        abort_if($incomingPdfCount > 0 && $existingImageCount > 0, 422, 'لا يمكن إضافة ملف PDF مع صور موجودة.');
        abort_if($incomingPdfCount > 1, 422, 'يمكن إرفاق ملف PDF واحد فقط.');
        abort_if($existingImageCount + $incomingImageCount > 2, 422, 'الحد الأقصى صورتان لكل مصروف.');

        $requestedNames = $request->input('display_names', []);

        foreach ($files->values() as $index => $file) {
            $path = $file->store('expense-attachments', 'local');
            $requestedName = trim((string) ($requestedNames[$index] ?? ''));
            $sequence = $existing->count() + $index + 1;
            $fallbackName = $this->isPdf($file) ? 'ملف PDF '.$sequence : 'صورة '.$sequence;

            $expense->attachments()->create([
                'original_name' => $file->getClientOriginalName(),
                'display_name' => $requestedName !== '' ? $requestedName : $fallbackName,
                'mime_type' => $file->getClientMimeType() ?: $file->getMimeType() ?: 'application/octet-stream',
                'size' => (int) $file->getSize(),
                'path' => $path,
                'public_token' => Str::random(48),
            ]);
        }

        return response()->json(['data' => $expense->fresh('attachments')], 201);
    }

    public function destroy(Request $request, Building $building, Expense $expense, ExpenseAttachment $attachment)
    {
        $this->assertManagerOrAdmin($request, $building);
        $this->assertExpenseBelongsToBuilding($building, $expense);
        abort_unless((int) $attachment->expense_id === (int) $expense->id, 404, 'المرفق غير موجود');

        $attachment->delete();

        return ['data' => $expense->fresh('attachments')];
    }

    public function show(ExpenseAttachment $attachment, string $token)
    {
        abort_unless(hash_equals((string) $attachment->public_token, $token), 404);
        abort_unless($attachment->path && Storage::disk('local')->exists($attachment->path), 404);

        return response()->file(
            Storage::disk('local')->path($attachment->path),
            [
                'Content-Type' => $attachment->mime_type ?: 'application/octet-stream',
                'Cache-Control' => 'private, max-age=3600',
            ]
        );
    }

    private function isPdf(UploadedFile $file): bool
    {
        $mime = strtolower((string) ($file->getClientMimeType() ?: $file->getMimeType()));
        $extension = strtolower((string) $file->getClientOriginalExtension());

        return str_contains($mime, 'pdf') || $extension === 'pdf';
    }

    private function attachmentIsPdf(ExpenseAttachment $attachment): bool
    {
        return str_contains(strtolower((string) $attachment->mime_type), 'pdf')
            || str_ends_with(strtolower((string) $attachment->original_name), '.pdf');
    }

    private function assertExpenseBelongsToBuilding(Building $building, Expense $expense): void
    {
        abort_unless((int) $expense->building_id === (int) $building->id, 404, 'المصروف غير موجود في هذا المبنى');
    }
}
