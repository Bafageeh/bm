<?php

use App\Services\ExpenseNotificationService;
use Illuminate\Support\Facades\Artisan;

Artisan::command('about:bm', function () {
    $this->info('BM Owners Association API');
});

Artisan::command('bm:send-expense-notifications', function () {
    $stats = app(ExpenseNotificationService::class)->sendDue();
    $this->info(sprintf(
        'Processed %d events: sent=%d failed=%d no_recipients=%d',
        $stats['events'],
        $stats['sent'],
        $stats['failed'],
        $stats['no_recipients']
    ));
})->purpose('Send due expense notifications to owners at 9:00 AM Asia/Riyadh.');
