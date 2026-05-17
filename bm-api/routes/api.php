<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BuildingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\OwnerController;
use App\Http\Controllers\Api\PaymentController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['ok' => true, 'app' => 'BM API']);

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/buildings', [BuildingController::class, 'index']);
    Route::post('/buildings', [BuildingController::class, 'store']);
    Route::get('/buildings/{building}', [BuildingController::class, 'show']);

    Route::get('/buildings/{building}/dashboard', [DashboardController::class, 'building']);
    Route::get('/owner/dashboard', [DashboardController::class, 'owner']);

    Route::get('/buildings/{building}/owners', [OwnerController::class, 'index']);
    Route::post('/buildings/{building}/owners', [OwnerController::class, 'store']);

    Route::get('/buildings/{building}/expenses', [ExpenseController::class, 'index']);
    Route::post('/buildings/{building}/expenses', [ExpenseController::class, 'store']);

    Route::get('/buildings/{building}/payments', [PaymentController::class, 'index']);
    Route::post('/buildings/{building}/payments', [PaymentController::class, 'store']);
});
