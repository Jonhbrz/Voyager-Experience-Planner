<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDayRequest;
use App\Http\Requests\UpdateDayRequest;
use App\Http\Resources\DayResource;
use App\Models\Day;
use Illuminate\Http\Request;

class DayController extends Controller
{
    // GET /api/days
    public function index(Request $request)
    {
        $query = Day::with(['activities', 'transports', 'stays'])->orderBy('order');

        if ($request->filled('trip_id')) {
            $query->where('trip_id', (int) $request->query('trip_id'));
        }

        return $this->successResponse(DayResource::collection($query->get()), 200);
    }

    // GET /api/days/{id}
    public function show($id)
    {
        $day = Day::with(['activities', 'transports', 'stays'])->findOrFail($id);
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

        $order = $validated['order'] ?? Day::where('trip_id', $resolvedTripId)->count();
        $day = Day::create([
            'trip_id' => $resolvedTripId,
            'title' => $validated['title'],
            'order' => $order,
        ]);
        $day->load(['activities', 'transports', 'stays']);

        return $this->successResponse(new DayResource($day), 201);
    }

    public function update(UpdateDayRequest $request, $id)
    {
        $day = Day::findOrFail($id);
        $day->update($request->validated());
        $day->load(['activities', 'transports', 'stays']);

        return $this->successResponse(new DayResource($day), 200);
    }

    public function destroy($id)
    {
        $day = Day::findOrFail($id);
        $day->delete();
        return $this->successResponse(['message' => 'Day deleted successfully.'], 200);
    }
}
