<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\AuthorizesOwnedApiResources;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreActivityRequest;
use App\Http\Requests\UpdateActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    use AuthorizesOwnedApiResources;

    // GET /api/activities
    public function index(Request $request)
    {
        $query = Activity::query()
            ->whereHas('day.trip', fn ($q) => $q->where('user_id', $request->user()->id))
            ->orderBy('start_time')
            ->orderBy('order');

        if ($request->filled('day_id')) {
            $dayId = (int) $request->query('day_id');
            $this->findDayForUserOrAbort($request, $dayId);
            $query->where('day_id', $dayId);
        }

        return $this->successResponse(ActivityResource::collection($query->get()), 200);
    }

    // GET /api/activities/{id}
    public function show(Request $request, $id)
    {
        $activity = $this->findActivityForUserOrAbort($request, (int) $id);

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

        $this->findDayForUserOrAbort($request, (int) $resolvedDayId);

        $order = $validated['order'] ?? Activity::where('day_id', $resolvedDayId)->count();
        $activity = Activity::create([
            'day_id' => $resolvedDayId,
            'title' => $validated['title'],
            'order' => $order,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'] ?? null,
            'completed' => $validated['completed'] ?? false,
            'price' => isset($validated['price']) ? (float) $validated['price'] : 0,
        ]);

        return $this->successResponse(new ActivityResource($activity), 201);
    }

    public function update(UpdateActivityRequest $request, $id)
    {
        $activity = $this->findActivityForUserOrAbort($request, (int) $id);
        $activity->update($request->validated());

        return $this->successResponse(new ActivityResource($activity), 200);
    }

    public function destroy(Request $request, $id)
    {
        $activity = $this->findActivityForUserOrAbort($request, (int) $id);
        $activity->delete();

        return response()->noContent();
    }
}
