<?php
namespace App\Http\Controllers\Api;
use App\Models\FaceEmbedding;
use Illuminate\Http\Request;
class FaceController { use Support; public function register(Request $r) { $guest = $this->guest($r->all()); $guest->faceEmbeddings()->create(['descriptor' => $r->descriptor]); return ['guest' => $guest]; } public function recognize(Request $r) { $best = FaceEmbedding::with('guest')->get()->map(fn($e)=>['guest'=>$e->guest,'score'=>$this->cosine($r->descriptor, $e->descriptor)])->sortByDesc('score')->first(); return ($best && $best['score'] >= 0.55) ? ['matched'=>true,'score'=>$best['score'],'guest'=>$best['guest']] : ['matched'=>false]; } public function verify(Request $r) { $best = FaceEmbedding::where('guest_id',$r->guest_id)->get()->map(fn($e)=>$this->cosine($r->descriptor, $e->descriptor))->max() ?? -1; return ['verified'=>$best >= 0.55,'score'=>$best]; } }
