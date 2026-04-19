<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DayController;
use App\Http\Controllers\Api\StayController;
use App\Http\Controllers\Api\TransportController;
use App\Http\Controllers\Api\TripController;
use Illuminate\Support\Facades\Route;

Route::options('{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

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
