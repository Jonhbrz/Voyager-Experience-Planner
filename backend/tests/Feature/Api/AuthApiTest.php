<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_protected_days_route_without_authentication_returns_401(): void
    {
        $this->getJson('/api/days')->assertUnauthorized();
    }

    public function test_protected_trips_route_without_authentication_returns_401(): void
    {
        $this->getJson('/api/trips')->assertUnauthorized();
    }

    public function test_login_with_valid_credentials_returns_200_and_token(): void
    {
        $user = User::factory()->create([
            'email' => 'auth-test@example.com',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'auth-test@example.com',
            'password' => 'password',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => ['user' => ['id', 'name', 'email'], 'token'],
            ]);
    }
}
