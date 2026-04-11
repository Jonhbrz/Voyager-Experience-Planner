<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreActivityRequest;
use App\Http\Requests\UpdateActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Models\Day;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    // GET /api/activities
    public function index(Request $request)
    {
        $query = Activity::query()
            ->whereHas('day.trip', fn ($q) => $q->where('user_id', $request->user()->id))
            ->orderBy('start_time')
            ->orderBy('order');

        if ($request->filled('day_id')) {
            $query->where('day_id', (int) $request->query('day_id'));
        }

        return $this->successResponse(ActivityResource::collection($query->get()), 200);
    }

    // GET /api/activities/{id}
    public function show(Request $request, $id)
    {
        $activity = Activity::whereHas('day.trip', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        return $this->successResponse(new ActivityResource($activity), 200);
    }

    // POST /api/activities or /api/days/{dayId}/activities
    public function store(StoreActivityRequest $request, $dayId = null)
    {
        $validated = $request->validated();
        $resolvedDayId = $dayId ?? ($validated['day_id'] ?? null);

        if (!$resolvedDayId) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => ['day_id' => ['The day_id field is required.']],
            ], 422);
        }

        Day::whereHas('trip', fn ($q) => $q->where('user_id', $request->user()->id))
            ->whereKey($resolvedDayId)
            ->firstOrFail();

        $order = $validated['order'] ?? Activity::where('day_id', $resolvedDayId)->count();
        $activity = Activity::create([
            'day_id' => $resolvedDayId,
            'title' => $validated['title'],
            'order' => $order,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'] ?? null,
        ]);

        return $this->successResponse(new ActivityResource($activity), 201);
    }

    public function update(UpdateActivityRequest $request, $id)
    {
        $activity = Activity::whereHas('day.trip', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);
        $activity->update($request->validated());

        return $this->successResponse(new ActivityResource($activity), 200);
    }

    public function destroy(Request $request, $id)
    {
        $activity = Activity::whereHas('day.trip', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);
        $activity->delete();
        return $this->successResponse(['message' => 'Activity deleted successfully.'], 200);
    }
}
