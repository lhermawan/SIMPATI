<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    protected $fillable = ['name', 'status'];
    public function employees() { return $this->hasMany(Employee::class); }
}
