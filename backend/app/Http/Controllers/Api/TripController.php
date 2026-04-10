<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTripRequest;
use App\Http\Requests\UpdateTripRequest;
use App\Http\Resources\TripResource;
use App\Models\Trip;
use Illuminate\Http\Request;

class TripController extends Controller
{
    // GET /api/trips
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 0);
        $query = Trip::with(['days.activities', 'days.transports', 'days.stays'])->latest();

        if ($perPage > 0) {
            $trips = $query->paginate($perPage);
        } else {
            $trips = $query->get();
        }

        return $this->successResponse(TripResource::collection($trips), 200);
    }

    // GET /api/trips/{id}
    public function show($id)
    {
        $trip = Trip::with(['days.activities', 'days.transports', 'days.stays'])->findOrFail($id);
        return $this->successResponse(new TripResource($trip), 200);
    }

    //POST /api/trips
    public function store(StoreTripRequest $request)
    {
        $trip = Trip::create($request->validated());
        return $this->successResponse(new TripResource($trip), 201);
    }

    // PUT /api/trips/{id}
    public function update(UpdateTripRequest $request, $id)
    {
        $trip = Trip::findOrFail($id);
        $trip->update($request->validated());
        return $this->successResponse(new TripResource($trip), 200);
    }

    // DELETE /api/trips/{id}
    public function destroy($id)
    {
        $trip = Trip::findOrFail($id);
        $trip->delete();
        return $this->successResponse(['message' => 'Trip deleted successfully.'], 200);
    }
}
