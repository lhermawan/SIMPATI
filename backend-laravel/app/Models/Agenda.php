<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Agenda extends Model
{
    protected $fillable = ['employee_id', 'date', 'start_time', 'end_time', 'title', 'description'];
    protected $casts = ['date' => 'date'];
    public function employee() { return $this->belongsTo(Employee::class); }
}
