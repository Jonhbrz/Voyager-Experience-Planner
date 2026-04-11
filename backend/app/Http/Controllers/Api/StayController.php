<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStayRequest;
use App\Http\Resources\StayResource;
use App\Models\Day;
use App\Models\Stay;
use Illuminate\Http\Request;

class StayController extends Controller
{
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

        Day::whereHas('trip', fn ($q) => $q->where('user_id', $request->user()->id))
            ->whereKey($resolvedDayId)
            ->firstOrFail();

        $stay = Stay::create([
            'day_id' => $resolvedDayId,
            'name' => $validated['name'],
            'location' => $validated['location'],
            'check_in' => $validated['check_in'] ?? null,
            'check_out' => $validated['check_out'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return $this->successResponse(new StayResource($stay), 201);
    }

    public function destroy(Request $request, $id)
    {
        $stay = Stay::whereHas('day.trip', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);
        $stay->delete();

        return $this->successResponse(['message' => 'Stay deleted successfully.'], 200);
    }
}
