<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\AuthorizesOwnedApiResources;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDayRequest;
use App\Http\Requests\UpdateDayRequest;
use App\Http\Resources\DayResource;
use App\Models\Day;
use App\Support\ApiCache;
use Illuminate\Http\Request;

class DayController extends Controller
{
    use AuthorizesOwnedApiResources;

    // GET /api/days
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $query = Day::select(['id', 'trip_id', 'title', 'order'])
            ->with([
                'activities:id,day_id,title,order,start_time,end_time,completed',
                'transports:id,day_id,from,to,type,duration,notes',
                'stays:id,day_id,name,location,check_in,check_out,notes',
            ])
            ->whereHas('trip', fn ($q) => $q->where('user_id', $userId))
            ->orderBy('order');

        if ($request->filled('trip_id')) {
            $tripId = (int) $request->query('trip_id');
            $this->findTripForUserOrAbort($request, $tripId);
            $query->where('trip_id', $tripId);
        }

        return $this->successResponse(DayResource::collection($query->get()), 200);
    }

    // GET /api/days/{id}
    public function show(Request $request, $id)
    {
        $day = $this->findDayForUserOrAbort($request, (int) $id);
        $day->load([
            'activities:id,day_id,title,order,start_time,end_time,completed',
            'transports:id,day_id,from,to,type,duration,notes',
            'stays:id,day_id,name,location,check_in,check_out,notes',
        ]);

        return $this->successResponse(new DayResource($day), 200);
    }

    // POST /api/days or /api/trips/{tripId}/days
    public function store(StoreDayRequest $request, $tripId = null)
    {
        $validated = $request->validated();
        $resolvedTripId = $tripId ?? ($validated['trip_id'] ?? null);

        if (!$resolvedTripId) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => ['trip_id' => ['The trip_id field is required.']],
            ], 422);
        }

        $this->findTripForUserOrAbort($request, (int) $resolvedTripId);

        $order = $validated['order'] ?? Day::where('trip_id', $resolvedTripId)->count();
        $day = Day::create([
            'trip_id' => $resolvedTripId,
            'title' => $validated['title'],
            'order' => $order,
        ]);
        $day->load([
            'activities:id,day_id,title,order,start_time,end_time,completed',
            'transports:id,day_id,from,to,type,duration,notes',
            'stays:id,day_id,name,location,check_in,check_out,notes',
        ]);
        ApiCache::forgetUserTrips((int) $request->user()->id);

        return $this->successResponse(new DayResource($day), 201);
    }

    public function update(UpdateDayRequest $request, $id)
    {
        $day = $this->findDayForUserOrAbort($request, (int) $id);
        $day->update($request->validated());
        $day->load([
            'activities:id,day_id,title,order,start_time,end_time,completed',
            'transports:id,day_id,from,to,type,duration,notes',
            'stays:id,day_id,name,location,check_in,check_out,notes',
        ]);
        ApiCache::forgetUserTrips((int) $request->user()->id);

        return $this->successResponse(new DayResource($day), 200);
    }

    public function destroy(Request $request, $id)
    {
        $day = $this->findDayForUserOrAbort($request, (int) $id);
        $day->delete();
        ApiCache::forgetUserTrips((int) $request->user()->id);

        return response()->noContent();
    }
}
