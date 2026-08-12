<?php

use App\Http\Controllers\Api\AgendaController;
use App\Http\Controllers\Api\AvailabilityController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\FaceController;
use App\Http\Controllers\Api\GuestController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\VisitController;
use Illuminate\Support\Facades\Route;

Route::get('/dashboard', DashboardController::class);
Route::apiResource('employees', EmployeeController::class);
Route::apiResource('guests', GuestController::class);
Route::apiResource('agendas', AgendaController::class);
Route::get('/availability', AvailabilityController::class);
Route::post('/face/register', [FaceController::class, 'register']);
Route::post('/face/recognize', [FaceController::class, 'recognize']);
Route::post('/face/verify', [FaceController::class, 'verify']);
Route::get('/visits/today', [VisitController::class, 'today']);
Route::post('/visits/{visit}/checkout', [VisitController::class, 'checkout']);
Route::apiResource('visits', VisitController::class)->only(['index', 'store', 'show']);
Route::post('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);
Route::post('/reservations/{reservation}/check-in', [ReservationController::class, 'checkIn']);
Route::apiResource('reservations', ReservationController::class)->only(['index', 'store', 'show']);
