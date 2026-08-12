<?php
namespace App\Http\Controllers\Api;
use App\Models\{Employee, Guest, Reservation, Visit};
class DashboardController { public function __invoke() { return ['counts' => ['guests' => Guest::count(), 'reservations' => Reservation::count(), 'checkedIn' => Visit::where('status', 'CHECKED_IN')->count(), 'employees' => Employee::where('status', 'active')->count()], 'currentVisits' => Visit::with(['guest','employee'])->where('status','CHECKED_IN')->latest()->get(), 'reservationsToday' => Reservation::with(['guest','employee'])->latest()->limit(10)->get()]; } }
