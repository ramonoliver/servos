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
        Schema::create('schedule_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('function_name')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'declined'])->default('pending');
            $table->text('decline_reason')->nullable();
            $table->foreignId('substitute_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_reserve')->default(false);
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->unique(['schedule_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_members');
    }
};
