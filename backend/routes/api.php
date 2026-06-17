<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\TableController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::prefix('/auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me'])->middleware('owner');
    Route::post('/register/request-otp', [AuthController::class, 'requestRegisterOtp']);
    Route::post('/register/verify-otp', [AuthController::class, 'verifyRegisterOtp']);
    Route::post('/login/request-otp', [AuthController::class, 'requestLoginOtp']);
    Route::post('/login/verify-otp', [AuthController::class, 'verifyLoginOtp']);
    Route::post('/change-phone/request-otp', [AuthController::class, 'requestChangePhoneOtp'])->middleware('owner');
    Route::post('/change-phone/verify-otp', [AuthController::class, 'verifyChangePhoneOtp'])->middleware('owner');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('owner');
});

Route::middleware('owner')->group(function () {
    Route::get('/restaurants', [RestaurantController::class, 'index']);
    Route::post('/restaurants', [RestaurantController::class, 'store']);
    Route::get('/restaurants/{restaurant}', [RestaurantController::class, 'show']);
    Route::patch('/restaurants/{restaurant}', [RestaurantController::class, 'update']);

    Route::get('/restaurants/{restaurant}/menu-items', [MenuItemController::class, 'index']);
    Route::post('/restaurants/{restaurant}/menu-items', [MenuItemController::class, 'store']);
    Route::patch('/restaurants/{restaurant}/menu-items/{menuItem}', [MenuItemController::class, 'update']);
    Route::delete('/restaurants/{restaurant}/menu-items/{menuItem}', [MenuItemController::class, 'destroy']);

    Route::get('/restaurants/{restaurant}/tables', [TableController::class, 'index']);
    Route::post('/restaurants/{restaurant}/tables', [TableController::class, 'store']);
    Route::delete('/restaurants/{restaurant}/tables/{table}', [TableController::class, 'destroy']);

    Route::get('/restaurants/{restaurant}/orders', [OrderController::class, 'index']);
    Route::get('/restaurants/{restaurant}/orders/sse', [OrderController::class, 'stream']);
    Route::patch('/restaurants/{restaurant}/orders/{order}/status', [OrderController::class, 'updateStatus']);

    Route::get('/restaurants/{restaurant}/reports', [ReportController::class, 'show']);

    Route::prefix('/admin')->middleware('admin')->group(function () {
        Route::get('/restaurants', [AdminController::class, 'restaurants']);
        Route::get('/restaurants/{restaurant}/menu-template', [AdminController::class, 'menuTemplate']);
    });
});

Route::prefix('/public')->group(function () {
    Route::get('/restaurants/{ref}/order-context', [PublicController::class, 'orderContext']);
    Route::get('/restaurants/{ref}/orders', [PublicController::class, 'tableOrders']);
    Route::post('/restaurants/{ref}/orders', [PublicController::class, 'placeOrder'])->middleware('throttle:10,1');
});
