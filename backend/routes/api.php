<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\DayController;
use App\Http\Controllers\Api\InvoicePdfController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\StayController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\TransportController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\UserInvoiceController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::options('{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');

Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store'])->middleware('throttle:5,1');
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->middleware('guest')->name('password.email');
Route::post('/reset-password', [NewPasswordController::class, 'store'])->middleware('guest')->name('password.store');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::post('/upgrade', [SubscriptionController::class, 'upgrade'])->middleware('throttle:5,1');
    Route::post('/downgrade', [SubscriptionController::class, 'downgrade'])->middleware('throttle:5,1');
    Route::post('/payment/simulate', [PaymentController::class, 'simulate'])->middleware('throttle:5,1');

    Route::get('/invoices', [UserInvoiceController::class, 'index']);
    Route::get('/invoices/{invoice}/pdf', [InvoicePdfController::class, 'show']);

    Route::middleware('superadmin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::patch('/users/{user}/plan', [AdminController::class, 'updateUserPlan']);
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);
        Route::get('/invoices', [AdminController::class, 'invoices']);
    });

    /*
     * Recursos REST (apiResource): GET/POST collection, GET/PUT/PATCH/DELETE por id.
     * Parámetros renombrados a {id} para coincidir con los controladores existentes.
     */
    Route::apiResource('trips', TripController::class)
        ->parameters(['trip' => 'id']);

    Route::apiResource('days', DayController::class)
        ->parameters(['day' => 'id'])
        ->except(['store']);

    // LEGACY ROUTE - mantener por compatibilidad
    Route::post('/days', [DayController::class, 'store']);
    Route::post('/trips/{tripId}/days', [DayController::class, 'store']);

    Route::apiResource('activities', ActivityController::class)
        ->parameters(['activity' => 'id'])
        ->except(['store']);

    // LEGACY ROUTE - mantener por compatibilidad
    Route::post('/activities', [ActivityController::class, 'store']);
    Route::post('/days/{dayId}/activities', [ActivityController::class, 'store']);

    Route::apiResource('transports', TransportController::class)
        ->parameters(['transport' => 'id']);
    Route::post('/days/{dayId}/transports', [TransportController::class, 'store']);

    Route::apiResource('stays', StayController::class)
        ->parameters(['stay' => 'id']);
    Route::post('/days/{dayId}/stays', [StayController::class, 'store']);
});
