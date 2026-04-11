<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTripRequest;
use App\Http\Requests\UpdateTripRequest;
use App\Http\Resources\TripResource;
use App\Models\Day;
use App\Models\Trip;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TripController extends Controller
{
    // GET /api/trips
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 0);
        $query = Trip::query()
            ->where('user_id', $request->user()->id)
            ->with(['days.activities', 'days.transports', 'days.stays'])
            ->latest();

        if ($perPage > 0) {
            $trips = $query->paginate($perPage);
        } else {
            $trips = $query->get();
        }

        return $this->successResponse(TripResource::collection($trips), 200);
    }

    // GET /api/trips/{id}
    public function show(Request $request, $id)
    {
        $trip = Trip::query()
            ->where('user_id', $request->user()->id)
            ->with(['days.activities', 'days.transports', 'days.stays'])
            ->findOrFail($id);

        return $this->successResponse(new TripResource($trip), 200);
    }

    //POST /api/trips
    public function store(StoreTripRequest $request)
    {
        $trip = DB::transaction(function () use ($request) {
            $validated = $request->validated();

            if (empty($validated['start_date']) || empty($validated['end_date'])) {
                abort(422, 'Dates are required');
            }

            $start = Carbon::parse($validated['start_date']);
            $end = Carbon::parse($validated['end_date']);
            $daysCount = $start->diffInDays($end) + 1;

            $trip = Trip::create([
                ...$validated,
                'user_id' => $request->user()->id,
            ]);

            for ($i = 0; $i < $daysCount; $i++) {
                Day::create([
                    'trip_id' => $trip->id,
                    'title' => 'Día '.($i + 1),
                    'order' => $i,
                ]);
            }

            return $trip;
        });

        $trip->load(['days.activities', 'days.transports', 'days.stays']);

        return $this->successResponse(new TripResource($trip), 201);
    }

    // PUT /api/trips/{id}
    public function update(UpdateTripRequest $request, $id)
    {
        $trip = Trip::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);
        $trip->update($request->validated());

        return $this->successResponse(new TripResource($trip), 200);
    }

    // DELETE /api/trips/{id}
    public function destroy(Request $request, $id)
    {
        $trip = Trip::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);
        $trip->delete();

        return $this->successResponse(['message' => 'Trip deleted successfully.'], 200);
    }
}
