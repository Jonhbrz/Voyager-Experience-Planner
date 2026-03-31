<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\DayController;
use App\Http\Controllers\Api\ActivityController;

Route::get('/trips', [TripController::class, 'index']);
Route::get('/trips/{id}', [TripController::class, 'show']);
Route::post('/trips', [TripController::class, 'store']);
Route::put('/trips/{id}', [TripController::class, 'update']);
Route::delete('/trips/{id}', [TripController::class, 'destroy']);

Route::post('/trips/{tripId}/days', [DayController::class, 'store']);
Route::put('/days/{id}', [DayController::class, 'update']);
Route::delete('/days/{id}', [DayController::class, 'destroy']);

Route::post('/days/{dayId}/activities', [ActivityController::class, 'store']);
Route::put('/activities/{id}', [ActivityController::class, 'update']);
Route::delete('/activities/{id}', [ActivityController::class, 'destroy']);
