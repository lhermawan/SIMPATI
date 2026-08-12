<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = ['unit_id', 'name', 'nip', 'position', 'email', 'phone', 'photo', 'status'];

    public function unit() { return $this->belongsTo(Unit::class); }
    public function agendas() { return $this->hasMany(Agenda::class); }
    public function visits() { return $this->hasMany(Visit::class); }
    public function reservations() { return $this->hasMany(Reservation::class); }
}
