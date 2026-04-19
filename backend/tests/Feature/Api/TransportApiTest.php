<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesTripGraph;
use Tests\TestCase;

class TransportApiTest extends TestCase
{
    use CreatesTripGraph;
    use RefreshDatabase;

    public function test_post_nested_transport_returns_201(): void
    {
        $user = User::factory()->create();
        ['day' => $day] = $this->createTripWithDay($user);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/days/{$day->id}/transports", [
            'from' => 'Madrid',
            'to' => 'Toledo',
            'type' => 'bus',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.from', 'Madrid');
    }

    public function test_delete_transport_returns_204(): void
    {
        $user = User::factory()->create();
        ['day' => $day] = $this->createTripWithDay($user);
        $transport = $this->createTransport($day);
        Sanctum::actingAs($user);

        $this->deleteJson("/api/transports/{$transport->id}")->assertNoContent();
    }

    public function test_get_foreign_transport_returns_403(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        ['day' => $day] = $this->createTripWithDay($owner);
        $transport = $this->createTransport($day);
        Sanctum::actingAs($other);

        $this->getJson("/api/transports/{$transport->id}")
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }
}
