<?php

namespace Tests\Support;

use App\Models\Activity;
use App\Models\Day;
use App\Models\Stay;
use App\Models\Transport;
use App\Models\Trip;
use App\Models\User;

trait CreatesTripGraph
{
    /**
     * @return array{trip: Trip, day: Day}
     */
    protected function createTripWithDay(User $owner, array $tripOverrides = []): array
    {
        $trip = Trip::query()->create(array_merge([
            'user_id' => $owner->id,
            'name' => 'Fixture trip',
            'description' => null,
            'start_date' => '2026-05-01',
            'end_date' => '2026-05-02',
        ], $tripOverrides));

        $day = Day::query()->create([
            'trip_id' => $trip->id,
            'title' => 'Día fixture',
            'order' => 0,
        ]);

        return ['trip' => $trip, 'day' => $day];
    }

    protected function createActivity(Day $day, array $overrides = []): Activity
    {
        return Activity::query()->create(array_merge([
            'day_id' => $day->id,
            'title' => 'Actividad',
            'order' => 0,
            'start_time' => '10:00:00',
            'end_time' => null,
            'completed' => false,
        ], $overrides));
    }

    protected function createTransport(Day $day, array $overrides = []): Transport
    {
        return Transport::query()->create(array_merge([
            'day_id' => $day->id,
            'from' => 'A',
            'to' => 'B',
            'type' => 'train',
            'duration' => null,
            'notes' => null,
        ], $overrides));
    }

    protected function createStay(Day $day, array $overrides = []): Stay
    {
        return Stay::query()->create(array_merge([
            'day_id' => $day->id,
            'name' => 'Hotel',
            'location' => 'Centro',
            'check_in' => null,
            'check_out' => null,
            'notes' => null,
        ], $overrides));
    }
}
