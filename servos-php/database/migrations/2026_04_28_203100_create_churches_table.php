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
        Schema::create('churches', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('city')->default('Cidade');
            $table->string('state', 2)->default('BR');
            $table->string('vision')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('church_id')->references('id')->on('churches')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['church_id']);
        });

        Schema::dropIfExists('churches');
    }
};
