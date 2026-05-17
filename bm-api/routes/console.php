<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('about:bm', function () {
    $this->info('BM Owners Association API');
});
