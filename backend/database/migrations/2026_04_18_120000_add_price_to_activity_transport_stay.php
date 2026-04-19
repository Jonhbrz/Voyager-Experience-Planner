<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->decimal('price', 10, 2)->default(0)->after('completed');
        });

        Schema::table('transports', function (Blueprint $table) {
            $table->decimal('price', 10, 2)->default(0)->after('type');
        });

        Schema::table('stays', function (Blueprint $table) {
            $table->decimal('price', 10, 2)->default(0)->after('location');
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn('price');
        });

        Schema::table('transports', function (Blueprint $table) {
            $table->dropColumn('price');
        });

        Schema::table('stays', function (Blueprint $table) {
            $table->dropColumn('price');
        });
    }
};
