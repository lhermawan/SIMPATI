<?php
namespace App\Http\Controllers\Api;
use App\Models\Employee;
use Illuminate\Http\Request;
class EmployeeController { public function index(Request $r) { return Employee::with('unit')->where('status','active')->when($r->q, fn($q,$v)=>$q->where('name','like',"%$v%"))->get()->map(fn($e)=>['id'=>$e->id,'name'=>$e->name,'label'=>trim($e->position.' '.($e->unit?->name ?? '')),'position'=>$e->position,'unit'=>$e->unit?->name]); } public function store(Request $r) { return Employee::create($r->all()); } public function show(Employee $employee) { return $employee->load('unit'); } public function update(Request $r, Employee $employee) { $employee->update($r->all()); return $employee; } public function destroy(Employee $employee) { $employee->update(['status'=>'inactive']); return $employee; } }
