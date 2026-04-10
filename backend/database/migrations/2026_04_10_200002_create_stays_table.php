<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('day_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('location');
            $table->dateTime('check_in')->nullable();
            $table->dateTime('check_out')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stays');
    }
};
