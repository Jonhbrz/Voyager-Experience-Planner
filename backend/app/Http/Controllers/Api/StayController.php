<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\AuthorizesOwnedApiResources;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStayRequest;
use App\Http\Requests\UpdateStayRequest;
use App\Http\Resources\StayResource;
use App\Models\Stay;
use App\Support\ApiCache;
use Illuminate\Http\Request;

class StayController extends Controller
{
    use AuthorizesOwnedApiResources;

    public function index(Request $request)
    {
        $stays = Stay::whereHas('day.trip', fn ($q) => $q->where('user_id', $request->user()->id))
            ->latest('id')
            ->get();

        return $this->successResponse(StayResource::collection($stays), 200);
    }

    public function show(Request $request, $id)
    {
        $stay = $this->findStayForUserOrAbort($request, (int) $id);

        return $this->successResponse(new StayResource($stay), 200);
    }

    public function store(StoreStayRequest $request, $dayId = null)
    {
        $validated = $request->validated();
        $resolvedDayId = $dayId ?? ($validated['day_id'] ?? null);

        if (! $resolvedDayId) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => ['day_id' => ['The day_id field is required.']],
            ], 422);
        }

        $this->findDayForUserOrAbort($request, (int) $resolvedDayId);

        $stay = Stay::create([
            'day_id' => $resolvedDayId,
            'name' => $validated['name'],
            'location' => $validated['location'],
            'price' => isset($validated['price']) ? (float) $validated['price'] : 0,
            'check_in' => $validated['check_in'] ?? null,
            'check_out' => $validated['check_out'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);
        ApiCache::forgetUserTrips((int) $request->user()->id);

        return $this->successResponse(new StayResource($stay), 201);
    }

    public function update(UpdateStayRequest $request, $id)
    {
        $stay = $this->findStayForUserOrAbort($request, (int) $id);

        $stay->update($request->validated());
        ApiCache::forgetUserTrips((int) $request->user()->id);

        return $this->successResponse(new StayResource($stay->fresh()), 200);
    }

    public function destroy(Request $request, $id)
    {
        $stay = $this->findStayForUserOrAbort($request, (int) $id);
        $stay->delete();
        ApiCache::forgetUserTrips((int) $request->user()->id);

        return response()->noContent();
    }
}
