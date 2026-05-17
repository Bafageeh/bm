<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

foreach (glob(__DIR__.'/../bootstrap/cache/routes*.php') ?: [] as $routesCacheFile) {
    @unlink($routesCacheFile);
}

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
