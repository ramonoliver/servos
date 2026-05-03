<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('church_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('time', 5);
            $table->string('arrival_time', 5)->nullable();
            $table->enum('status', ['draft', 'active', 'cancelled', 'completed'])->default('draft');
            $table->text('instructions')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('published')->default(false);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
