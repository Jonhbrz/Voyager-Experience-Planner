<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('day_id')->constrained()->cascadeOnDelete();
            $table->string('from');
            $table->string('to');
            $table->string('type');
            $table->string('duration')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transports');
    }
};
