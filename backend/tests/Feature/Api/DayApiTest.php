<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesTripGraph;
use Tests\TestCase;

class DayApiTest extends TestCase
{
    use CreatesTripGraph;
    use RefreshDatabase;

    public function test_get_days_returns_200_for_owner(): void
    {
        $user = User::factory()->create();
        $this->createTripWithDay($user);
        Sanctum::actingAs($user);

        $this->getJson('/api/days')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_post_nested_day_returns_201(): void
    {
        $user = User::factory()->create();
        ['trip' => $trip] = $this->createTripWithDay($user);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/trips/{$trip->id}/days", [
            'title' => 'Día extra',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Día extra');
    }

    public function test_put_day_returns_200(): void
    {
        $user = User::factory()->create();
        ['day' => $day] = $this->createTripWithDay($user);
        Sanctum::actingAs($user);

        $this->putJson("/api/days/{$day->id}", ['title' => 'Título nuevo'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Título nuevo');
    }

    public function test_delete_day_returns_204(): void
    {
        $user = User::factory()->create();
        ['day' => $day] = $this->createTripWithDay($user);
        Sanctum::actingAs($user);

        $this->deleteJson("/api/days/{$day->id}")->assertNoContent();
    }

    public function test_get_days_filtered_by_foreign_trip_id_returns_403(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        ['trip' => $trip] = $this->createTripWithDay($owner);
        Sanctum::actingAs($other);

        $this->getJson("/api/days?trip_id={$trip->id}")
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_get_foreign_day_returns_403(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        ['day' => $day] = $this->createTripWithDay($owner);
        Sanctum::actingAs($other);

        $this->getJson("/api/days/{$day->id}")
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_post_day_without_title_returns_422(): void
    {
        $user = User::factory()->create();
        ['trip' => $trip] = $this->createTripWithDay($user);
        Sanctum::actingAs($user);

        $this->postJson("/api/trips/{$trip->id}/days", ['title' => ''])
            ->assertUnprocessable()
            ->assertJsonPath('success', false);
    }
}
