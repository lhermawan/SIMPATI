<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class FaceEmbedding extends Model
{
    protected $fillable = ['guest_id', 'descriptor'];
    protected $casts = ['descriptor' => 'array'];
    public function guest() { return $this->belongsTo(Guest::class); }
}
