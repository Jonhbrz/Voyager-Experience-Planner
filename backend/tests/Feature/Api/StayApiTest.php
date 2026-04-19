<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesTripGraph;
use Tests\TestCase;

class StayApiTest extends TestCase
{
    use CreatesTripGraph;
    use RefreshDatabase;

    public function test_post_stay_with_day_id_in_body_returns_201(): void
    {
        $user = User::factory()->create();
        ['day' => $day] = $this->createTripWithDay($user);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/stays', [
            'day_id' => $day->id,
            'name' => 'Pensión Sol',
            'location' => 'Plaza Mayor',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Pensión Sol');
    }

    public function test_get_foreign_stay_returns_403(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        ['day' => $day] = $this->createTripWithDay($owner);
        $stay = $this->createStay($day);
        Sanctum::actingAs($other);

        $this->getJson("/api/stays/{$stay->id}")
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }
}
