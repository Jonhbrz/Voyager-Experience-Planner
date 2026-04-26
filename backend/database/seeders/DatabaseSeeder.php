<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::query()->firstOrCreate([
            'email' => 'test@example.com',
        ], [
            'name' => 'Test User',
            'password' => Hash::make('password'),
        ]);

        $superadmin = User::query()->firstOrCreate(
            ['email' => 'jonathanborza02@gmail.com'],
            [
                'name' => 'Jonathan Borza',
                'password' => Hash::make(str()->random(32)),
            ]
        );

        $superadmin->forceFill([
            'role' => User::ROLE_SUPERADMIN,
            'plan' => User::PLAN_PREMIUM,
        ])->save();
    }
}
