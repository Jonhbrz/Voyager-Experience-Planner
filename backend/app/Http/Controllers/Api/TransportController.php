<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\AuthorizesOwnedApiResources;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransportRequest;
use App\Http\Requests\UpdateTransportRequest;
use App\Http\Resources\TransportResource;
use App\Models\Transport;
use Illuminate\Http\Request;

class TransportController extends Controller
{
    use AuthorizesOwnedApiResources;

    public function index(Request $request)
    {
        $transports = Transport::whereHas('day.trip', fn ($q) => $q->where('user_id', $request->user()->id))
            ->latest('id')
            ->get();

        return $this->successResponse(TransportResource::collection($transports), 200);
    }

    public function show(Request $request, $id)
    {
        $transport = $this->findTransportForUserOrAbort($request, (int) $id);

        return $this->successResponse(new TransportResource($transport), 200);
    }

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

        $this->findDayForUserOrAbort($request, (int) $resolvedDayId);

        $transport = Transport::create([
            'day_id' => $resolvedDayId,
            'from' => $validated['from'],
            'to' => $validated['to'],
            'type' => $validated['type'],
            'price' => isset($validated['price']) ? (float) $validated['price'] : 0,
            'duration' => $validated['duration'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return $this->successResponse(new TransportResource($transport), 201);
    }

    public function update(UpdateTransportRequest $request, $id)
    {
        $transport = $this->findTransportForUserOrAbort($request, (int) $id);

        $transport->update($request->validated());

        return $this->successResponse(new TransportResource($transport->fresh()), 200);
    }

    public function destroy(Request $request, $id)
    {
        $transport = $this->findTransportForUserOrAbort($request, (int) $id);
        $transport->delete();

        return response()->noContent();
    }
}
