<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use Illuminate\Http\Request;

class TripController extends Controller
{
    // GET /api/trips
    public function index()
    {
        return Trip::with('days.activities')->get();
    }

    // GET /api/trips/{id}
    public function show($id)
    {
        return Trip::with('days.activities')->findOrFail($id);
    }

    // POST /api/trips
    public function store(Request $request)
    {
        $trip = Trip::create([
            'name' => $request->name,
            'description' => $request->description
        ]);

        return response()->json($trip, 201);
    }

    // PUT /api/trips/{id}
    public function update(Request $request, $id)
    {
        $trip = Trip::findOrFail($id);

        $trip->update([
            'name' => $request->name,
            'description' => $request->description
        ]);

        return $trip;
    }

    // DELETE /api/trips/{id}
    public function destroy($id)
    {
        $trip = Trip::findOrFail($id);
        $trip->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
