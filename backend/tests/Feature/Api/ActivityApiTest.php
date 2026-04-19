<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesTripGraph;
use Tests\TestCase;

class ActivityApiTest extends TestCase
{
    use CreatesTripGraph;
    use RefreshDatabase;

    public function test_post_nested_activity_returns_201(): void
    {
        $user = User::factory()->create();
        ['day' => $day] = $this->createTripWithDay($user);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/days/{$day->id}/activities", [
            'title' => 'Museo',
            'start_time' => '11:30',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Museo');
    }

    public function test_get_activities_filtered_by_foreign_day_id_returns_403(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        ['day' => $day] = $this->createTripWithDay($owner);
        Sanctum::actingAs($other);

        $this->getJson("/api/activities?day_id={$day->id}")
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_get_foreign_activity_returns_403(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        ['day' => $day] = $this->createTripWithDay($owner);
        $activity = $this->createActivity($day);
        Sanctum::actingAs($other);

        $this->getJson("/api/activities/{$activity->id}")
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_post_activity_without_title_returns_422(): void
    {
        $user = User::factory()->create();
        ['day' => $day] = $this->createTripWithDay($user);
        Sanctum::actingAs($user);

        $this->postJson("/api/days/{$day->id}/activities", [
            'title' => '',
            'start_time' => '09:00',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false);
    }
}
