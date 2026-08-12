<?php
namespace App\Http\Controllers\Api;
use App\Models\Guest;
use Illuminate\Http\Request;
class GuestController { public function index(Request $r) { return Guest::withCount('visits')->when($r->q, fn($q,$v)=>$q->where('name','like',"%$v%")->orWhere('phone','like',"%$v%")->orWhere('company','like',"%$v%"))->latest()->get(); } public function store(Request $r) { return Guest::create($r->validate(['name'=>'required','phone'=>'required','company'=>'required'])); } public function show(Guest $guest) { return $guest->load(['visits.employee','reservations.employee']); } public function update(Request $r, Guest $guest) { $guest->update($r->all()); return $guest; } public function destroy(Guest $guest) { $guest->update(['status'=>'inactive']); return $guest; } }
