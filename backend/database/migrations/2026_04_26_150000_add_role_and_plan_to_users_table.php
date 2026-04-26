<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['superadmin', 'user'])->default('user')->after('password');
            $table->enum('plan', ['free', 'premium'])->default('free')->after('role');
        });

        DB::table('users')
            ->where('email', 'jonathanborza02@gmail.com')
            ->update([
                'role' => 'superadmin',
                'plan' => 'premium',
            ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'plan']);
        });
    }
};
