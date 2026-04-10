<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreActivityRequest;
use App\Http\Requests\UpdateActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    // GET /api/activities
    public function index(Request $request)
    {
        $query = Activity::orderBy('order');

        if ($request->filled('day_id')) {
            $query->where('day_id', (int) $request->query('day_id'));
        }

        return $this->successResponse(ActivityResource::collection($query->get()), 200);
    }

    // GET /api/activities/{id}
    public function show($id)
    {
        $activity = Activity::findOrFail($id);
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

        $order = $validated['order'] ?? Activity::where('day_id', $resolvedDayId)->count();
        $activity = Activity::create([
            'day_id' => $resolvedDayId,
            'title' => $validated['title'],
            'order' => $order,
        ]);

        return $this->successResponse(new ActivityResource($activity), 201);
    }

    public function update(UpdateActivityRequest $request, $id)
    {
        $activity = Activity::findOrFail($id);
        $activity->update($request->validated());
        return $this->successResponse(new ActivityResource($activity), 200);
    }

    public function destroy($id)
    {
        $activity = Activity::findOrFail($id);
        $activity->delete();
        return $this->successResponse(['message' => 'Activity deleted successfully.'], 200);
    }
}
