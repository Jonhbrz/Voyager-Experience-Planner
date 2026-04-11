<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransportRequest;
use App\Http\Resources\TransportResource;
use App\Models\Day;
use App\Models\Transport;
use Illuminate\Http\Request;

class TransportController extends Controller
{
    public function store(StoreTransportRequest $request, $dayId = null)
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

        $transport = Transport::create([
            'day_id' => $resolvedDayId,
            'from' => $validated['from'],
            'to' => $validated['to'],
            'type' => $validated['type'],
            'duration' => $validated['duration'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return $this->successResponse(new TransportResource($transport), 201);
    }

    public function destroy(Request $request, $id)
    {
        $transport = Transport::whereHas('day.trip', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);
        $transport->delete();

        return $this->successResponse(['message' => 'Transport deleted successfully.'], 200);
    }
}
