<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Activity;
use App\Models\Day;
use App\Models\Stay;
use App\Models\Transport;
use App\Models\Trip;
use Illuminate\Http\Request;

trait AuthorizesOwnedApiResources
{
    protected function findTripForUserOrAbort(Request $request, int $tripId): Trip
    {
        $trip = Trip::query()->find($tripId);
        abort_if($trip === null, 404);
        abort_if((int) $trip->user_id !== (int) $request->user()->id, 403);

        return $trip;
    }

    protected function findDayForUserOrAbort(Request $request, int $dayId): Day
    {
        $day = Day::query()->with('trip')->find($dayId);
        abort_if($day === null, 404);
        abort_if($day->trip === null, 404);
        abort_if((int) $day->trip->user_id !== (int) $request->user()->id, 403);

        return $day;
    }

    protected function findActivityForUserOrAbort(Request $request, int $activityId): Activity
    {
        $activity = Activity::query()->with('day.trip')->find($activityId);
        abort_if($activity === null, 404);
        abort_if($activity->day === null || $activity->day->trip === null, 404);
        abort_if((int) $activity->day->trip->user_id !== (int) $request->user()->id, 403);

        return $activity;
    }

    protected function findTransportForUserOrAbort(Request $request, int $transportId): Transport
    {
        $transport = Transport::query()->with('day.trip')->find($transportId);
        abort_if($transport === null, 404);
        abort_if($transport->day === null || $transport->day->trip === null, 404);
        abort_if((int) $transport->day->trip->user_id !== (int) $request->user()->id, 403);

        return $transport;
    }

    protected function findStayForUserOrAbort(Request $request, int $stayId): Stay
    {
        $stay = Stay::query()->with('day.trip')->find($stayId);
        abort_if($stay === null, 404);
        abort_if($stay->day === null || $stay->day->trip === null, 404);
        abort_if((int) $stay->day->trip->user_id !== (int) $request->user()->id, 403);

        return $stay;
    }
}
