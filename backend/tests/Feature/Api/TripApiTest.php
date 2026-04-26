<?php

namespace Tests\Feature\Api;

use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesTripGraph;
use Tests\TestCase;

class TripApiTest extends TestCase
{
    use CreatesTripGraph;
    use RefreshDatabase;

    public function test_get_trips_requires_authentication(): void
    {
        $response = $this->getJson('/api/trips');

        $response->assertUnauthorized();
    }

    public function test_get_trips_returns_only_authenticated_user_trips(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Trip::query()->create([
            'user_id' => $user->id,
            'name' => 'Viaje propio',
            'description' => 'Descripción',
            'start_date' => '2026-05-01',
            'end_date' => '2026-05-03',
        ]);
        Trip::query()->create([
            'user_id' => $otherUser->id,
            'name' => 'Viaje ajeno',
            'description' => 'No debe verse',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-02',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/trips');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Viaje propio');
    }

    public function test_post_trips_creates_trip_and_returns_201(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $payload = [
            'name' => 'Semana en Roma',
            'description' => 'Viaje cultural',
            'start_date' => '2026-07-10',
            'end_date' => '2026-07-12',
        ];

        $response = $this->postJson('/api/trips', $payload);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Semana en Roma')
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'name',
                    'description',
                    'start_date',
                    'end_date',
                    'days',
                ],
            ]);

        $this->assertDatabaseHas('trips', [
            'user_id' => $user->id,
            'name' => 'Semana en Roma',
        ]);
    }

    public function test_free_user_cannot_create_more_than_three_trips(): void
    {
        $user = User::factory()->create(['plan' => User::PLAN_FREE]);
        $this->createTripRows($user, 3);
        Sanctum::actingAs($user);

        $this->postJson('/api/trips', [
            'name' => 'Cuarto viaje',
            'description' => '',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-02',
        ])
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_premium_user_can_create_more_than_three_trips(): void
    {
        $user = User::factory()->create(['plan' => User::PLAN_PREMIUM]);
        $this->createTripRows($user, 3);
        Sanctum::actingAs($user);

        $this->postJson('/api/trips', [
            'name' => 'Cuarto viaje',
            'description' => '',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-02',
        ])->assertCreated();
    }

    public function test_superadmin_can_create_more_than_three_trips_on_free_plan(): void
    {
        $user = User::factory()->create([
            'role' => User::ROLE_SUPERADMIN,
            'plan' => User::PLAN_FREE,
        ]);
        $this->createTripRows($user, 3);
        Sanctum::actingAs($user);

        $this->postJson('/api/trips', [
            'name' => 'Cuarto viaje',
            'description' => '',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-02',
        ])->assertCreated();
    }

    public function test_delete_trips_removes_trip_for_owner(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $trip = Trip::query()->create([
            'user_id' => $user->id,
            'name' => 'Viaje a eliminar',
            'description' => null,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-01',
        ]);

        $response = $this->deleteJson("/api/trips/{$trip->id}");

        $response->assertNoContent();

        $this->assertDatabaseMissing('trips', ['id' => $trip->id]);
    }

    public function test_get_trips_returns_200_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/trips')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(0, 'data');
    }

    public function test_get_single_trip_returns_200_for_owner(): void
    {
        $user = User::factory()->create();
        ['trip' => $trip] = $this->createTripWithDay($user);
        Sanctum::actingAs($user);

        $this->getJson("/api/trips/{$trip->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $trip->id)
            ->assertJsonPath('data.name', $trip->name);
    }

    public function test_get_single_trip_returns_403_for_other_users_trip(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        ['trip' => $trip] = $this->createTripWithDay($owner);
        Sanctum::actingAs($intruder);

        $this->getJson("/api/trips/{$trip->id}")
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_delete_foreign_trip_returns_403(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        ['trip' => $trip] = $this->createTripWithDay($owner);
        Sanctum::actingAs($intruder);

        $this->deleteJson("/api/trips/{$trip->id}")
            ->assertForbidden()
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('trips', ['id' => $trip->id]);
    }

    public function test_post_trips_returns_422_when_end_date_is_before_start_date(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/trips', [
            'name' => 'Inválido',
            'description' => '',
            'start_date' => '2026-09-10',
            'end_date' => '2026-09-01',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false);
    }

    private function createTripRows(User $user, int $count): void
    {
        for ($i = 1; $i <= $count; $i++) {
            Trip::query()->create([
                'user_id' => $user->id,
                'name' => "Viaje {$i}",
                'description' => null,
                'start_date' => '2026-09-01',
                'end_date' => '2026-09-02',
            ]);
        }
    }
}
