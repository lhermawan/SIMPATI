<?php
namespace App\Http\Controllers\Api;
use App\Models\{Guest, Visit};
use Illuminate\Http\Request;
class VisitController { use Support; public function index() { return Visit::with(['guest','employee'])->latest()->get(); } public function today() { return Visit::with(['guest','employee'])->whereDate('visit_date', now())->get(); } public function show(Visit $visit) { return $visit->load(['guest','employee']); } public function store(Request $r) { $guest = $r->guest_id ? Guest::findOrFail($r->guest_id) : $this->guest($r->all()); $visit = Visit::create(['guest_id'=>$guest->id,'employee_id'=>$r->employee_id,'purpose'=>$r->purpose,'visit_date'=>now()->toDateString(),'check_in_at'=>now(),'visit_type'=>$r->visit_type ?? 'walk-in','status'=>'CHECKED_IN']); return ['visit'=>$visit,'guest'=>$guest]; } public function checkout(Visit $visit) { $visit->update(['check_out_at'=>now(),'status'=>'COMPLETED']); return $visit; } }
