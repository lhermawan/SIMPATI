<?php

namespace App\Http\Controllers\Api;

use App\Models\Agenda;
use App\Models\Guest;
use App\Models\Reservation;
use Carbon\Carbon;

trait Support
{
    protected function guest(array $data): Guest
    {
        return Guest::updateOrCreate(['phone' => $data['phone']], ['name' => $data['name'], 'company' => $data['company'], 'status' => 'active']);
    }

    protected function slots(int $employeeId, string $date): array
    {
        $slots = [];
        $start = Carbon::parse('08:00');
        $end = Carbon::parse('16:00');
        while ($start->lt($end)) {
            $slotEnd = $start->copy()->addHour();
            $agenda = Agenda::where('employee_id', $employeeId)->whereDate('date', $date)->where('start_time', '<', $slotEnd->format('H:i:s'))->where('end_time', '>', $start->format('H:i:s'))->first();
            $booked = Reservation::where('employee_id', $employeeId)->whereDate('date', $date)->whereNotIn('status', ['CANCELLED', 'EXPIRED', 'NO_SHOW'])->where('start_time', '<', $slotEnd->format('H:i:s'))->where('end_time', '>', $start->format('H:i:s'))->exists();
            $slots[] = ['start' => $start->format('H:i'), 'end' => $slotEnd->format('H:i'), 'available' => ! $agenda && ! $booked, 'reason' => $agenda?->title ?? ($booked ? 'Slot sudah dipesan' : 'Tersedia')];
            $start = $slotEnd;
        }
        return $slots;
    }

    protected function cosine(array $a, array $b): float
    {
        if (count($a) !== count($b)) return -1;
        $dot = $ma = $mb = 0;
        foreach ($a as $i => $value) { $dot += $value * $b[$i]; $ma += $value ** 2; $mb += $b[$i] ** 2; }
        return $dot / (sqrt($ma) * sqrt($mb));
    }
}
