<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('status')->default('active'); $table->timestamps();
        });
        Schema::create('employees', function (Blueprint $table) {
            $table->id(); $table->foreignId('unit_id')->nullable()->constrained()->nullOnDelete(); $table->string('name'); $table->string('nip')->nullable(); $table->string('position'); $table->string('email')->nullable(); $table->string('phone')->nullable(); $table->string('photo')->nullable(); $table->string('status')->default('active'); $table->timestamps();
        });
        Schema::create('guests', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('phone')->unique(); $table->string('company'); $table->string('face_photo')->nullable(); $table->string('status')->default('active'); $table->timestamps();
        });
        Schema::create('face_embeddings', function (Blueprint $table) {
            $table->id(); $table->foreignId('guest_id')->constrained()->cascadeOnDelete(); $table->json('descriptor'); $table->timestamps();
        });
        Schema::create('agendas', function (Blueprint $table) {
            $table->id(); $table->foreignId('employee_id')->constrained()->cascadeOnDelete(); $table->date('date'); $table->time('start_time'); $table->time('end_time'); $table->string('title'); $table->text('description')->nullable(); $table->timestamps();
        });
        Schema::create('visits', function (Blueprint $table) {
            $table->id(); $table->foreignId('guest_id')->constrained()->cascadeOnDelete(); $table->foreignId('employee_id')->constrained()->cascadeOnDelete(); $table->text('purpose'); $table->date('visit_date'); $table->timestamp('check_in_at')->nullable(); $table->timestamp('check_out_at')->nullable(); $table->string('visit_type')->default('walk-in'); $table->string('status')->default('CHECKED_IN'); $table->timestamps();
        });
        Schema::create('reservations', function (Blueprint $table) {
            $table->id(); $table->foreignId('guest_id')->constrained()->cascadeOnDelete(); $table->foreignId('employee_id')->constrained()->cascadeOnDelete(); $table->string('code')->unique(); $table->string('token', 96)->unique(); $table->date('date'); $table->time('start_time'); $table->time('end_time'); $table->text('purpose'); $table->string('status')->default('CONFIRMED'); $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('reservations'); Schema::dropIfExists('visits'); Schema::dropIfExists('agendas'); Schema::dropIfExists('face_embeddings'); Schema::dropIfExists('guests'); Schema::dropIfExists('employees'); Schema::dropIfExists('units');
    }
};
