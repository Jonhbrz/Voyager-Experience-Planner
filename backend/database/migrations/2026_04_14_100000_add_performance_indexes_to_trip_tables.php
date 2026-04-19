<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('days', function (Blueprint $table) {
            $table->index(['trip_id', 'order']);
        });

        Schema::table('activities', function (Blueprint $table) {
            $table->index(['day_id', 'order']);
            $table->index(['day_id', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropIndex(['day_id', 'order']);
            $table->dropIndex(['day_id', 'start_time']);
        });

        Schema::table('days', function (Blueprint $table) {
            $table->dropIndex(['trip_id', 'order']);
        });
    }
};
