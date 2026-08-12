<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Visit extends Model
{
    protected $fillable = ['guest_id', 'employee_id', 'purpose', 'visit_date', 'check_in_at', 'check_out_at', 'visit_type', 'status'];
    protected $casts = ['visit_date' => 'date', 'check_in_at' => 'datetime', 'check_out_at' => 'datetime'];
    public function guest() { return $this->belongsTo(Guest::class); }
    public function employee() { return $this->belongsTo(Employee::class); }
}
