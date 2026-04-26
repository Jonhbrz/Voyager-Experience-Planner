<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Auth\Passwords\PasswordBroker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
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

    public function test_registration_returns_user_and_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'New User',
            'email' => 'new-user@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => ['user' => ['id', 'name', 'email'], 'token'],
            ]);
    }

    public function test_authenticated_user_can_update_profile(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this
            ->withToken($token)
            ->patchJson('/api/profile', [
                'name' => 'Updated Name',
                'email' => 'updated@example.com',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.user.name', 'Updated Name')
            ->assertJsonPath('data.user.email', 'updated@example.com');
    }

    public function test_profile_email_must_be_unique(): void
    {
        $user = User::factory()->create();
        $existing = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $this
            ->withToken($token)
            ->patchJson('/api/profile', [
                'name' => 'Updated Name',
                'email' => $existing->email,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_update_password(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this
            ->withToken($token)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response->assertOk();

        $this->assertTrue(Hash::check('new-password', $user->refresh()->password));
    }

    public function test_password_update_requires_current_password(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $this
            ->withToken($token)
            ->putJson('/api/profile/password', [
                'current_password' => 'wrong-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password']);

        $this->assertTrue(Hash::check('password', $user->refresh()->password));
    }

    public function test_forgot_password_sends_frontend_reset_link(): void
    {
        Notification::fake();
        config(['app.frontend_url' => 'http://spa.test']);
        $user = User::factory()->create(['email' => 'reset@example.com']);

        $this
            ->postJson('/api/forgot-password', ['email' => 'reset@example.com'])
            ->assertOk()
            ->assertJsonPath('success', true);

        Notification::assertSentTo(
            $user,
            ResetPasswordNotification::class,
            function (ResetPasswordNotification $notification) use ($user): bool {
                $resetUrl = $notification->toMail($user)->actionUrl;
                $parts = parse_url($resetUrl);
                parse_str($parts['query'] ?? '', $query);

                return ($parts['scheme'] ?? null) === 'http'
                    && ($parts['host'] ?? null) === 'spa.test'
                    && ($parts['path'] ?? null) === '/reset-password'
                    && ($query['email'] ?? null) === 'reset@example.com'
                    && ! empty($query['token']);
            }
        );
    }

    public function test_reset_password_with_token_updates_password(): void
    {
        $user = User::factory()->create(['email' => 'reset@example.com']);
        /** @var PasswordBroker $broker */
        $broker = Password::broker();
        $token = $broker->createToken($user);

        $this
            ->postJson('/api/reset-password', [
                'token' => $token,
                'email' => 'reset@example.com',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertTrue(Hash::check('new-password', $user->refresh()->password));
    }
}
