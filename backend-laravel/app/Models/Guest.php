<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Guest extends Model
{
    protected $fillable = ['name', 'phone', 'company', 'face_photo', 'status'];

    public function faceEmbeddings() { return $this->hasMany(FaceEmbedding::class); }
    public function visits() { return $this->hasMany(Visit::class); }
    public function reservations() { return $this->hasMany(Reservation::class); }
}
