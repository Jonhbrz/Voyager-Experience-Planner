<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'jonathanborza02@gmail.com'],
            [
                'name' => 'Jonathan Borza',
                // Plain text: User model uses cast password => 'hashed' (do not Hash::make here).
                'password' => '123456',
                'role' => User::ROLE_SUPERADMIN,
                'plan' => User::PLAN_PREMIUM,
            ]
        );
    }
}
