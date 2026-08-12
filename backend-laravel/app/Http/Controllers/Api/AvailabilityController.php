<?php
namespace App\Http\Controllers\Api;
use Illuminate\Http\Request;
class AvailabilityController { use Support; public function __invoke(Request $r) { return $this->slots((int) $r->employee_id, $r->date); } }
