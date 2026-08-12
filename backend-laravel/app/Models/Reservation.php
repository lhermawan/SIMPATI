<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Reservation extends Model
{
    protected $fillable = ['guest_id', 'employee_id', 'code', 'token', 'date', 'start_time', 'end_time', 'purpose', 'status'];
    protected $casts = ['date' => 'date'];
    public function guest() { return $this->belongsTo(Guest::class); }
    public function employee() { return $this->belongsTo(Employee::class); }
}
