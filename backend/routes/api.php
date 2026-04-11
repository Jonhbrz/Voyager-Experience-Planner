<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\DayController;
use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\TransportController;
use App\Http\Controllers\Api\StayController;

Route::options('{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/trips', [TripController::class, 'index']);
    Route::get('/trips/{id}', [TripController::class, 'show']);
    Route::post('/trips', [TripController::class, 'store']);
    Route::put('/trips/{id}', [TripController::class, 'update']);
    Route::patch('/trips/{id}', [TripController::class, 'update']);
    Route::delete('/trips/{id}', [TripController::class, 'destroy']);

    Route::post('/trips/{tripId}/days', [DayController::class, 'store']);
    Route::get('/days', [DayController::class, 'index']);
    Route::get('/days/{id}', [DayController::class, 'show']);
    Route::post('/days', [DayController::class, 'store']);
    Route::put('/days/{id}', [DayController::class, 'update']);
    Route::patch('/days/{id}', [DayController::class, 'update']);
    Route::delete('/days/{id}', [DayController::class, 'destroy']);

    Route::post('/days/{dayId}/activities', [ActivityController::class, 'store']);
    Route::get('/activities', [ActivityController::class, 'index']);
    Route::get('/activities/{id}', [ActivityController::class, 'show']);
    Route::post('/activities', [ActivityController::class, 'store']);
    Route::put('/activities/{id}', [ActivityController::class, 'update']);
    Route::patch('/activities/{id}', [ActivityController::class, 'update']);
    Route::delete('/activities/{id}', [ActivityController::class, 'destroy']);

    Route::post('/days/{dayId}/transports', [TransportController::class, 'store']);
    Route::delete('/transports/{id}', [TransportController::class, 'destroy']);

    Route::post('/days/{dayId}/stays', [StayController::class, 'store']);
    Route::delete('/stays/{id}', [StayController::class, 'destroy']);
});
