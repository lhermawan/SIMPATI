<?php
namespace App\Http\Controllers\Api;
use App\Models\Agenda;
use Illuminate\Http\Request;
class AgendaController { public function index() { return Agenda::with('employee')->latest()->get(); } public function store(Request $r) { return Agenda::create($r->all()); } public function show(Agenda $agenda) { return $agenda->load('employee'); } public function update(Request $r, Agenda $agenda) { $agenda->update($r->all()); return $agenda; } public function destroy(Agenda $agenda) { $agenda->delete(); return ['ok'=>true]; } }
