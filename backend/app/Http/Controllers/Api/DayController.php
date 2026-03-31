<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Day;
use Illuminate\Http\Request;

class DayController extends Controller
{
    public function store(Request $request, $tripId)
    {
        $order = Day::where('trip_id', $tripId)->count();

        $day = Day::create([
            'trip_id' => $tripId,
            'title' => $request->title,
            'order' => $order
        ]);

        return $day;
    }

    public function update(Request $request, $id)
    {
        $day = Day::findOrFail($id);

        $day->update([
            'title' => $request->title
        ]);

        return $day;
    }

    public function destroy($id)
    {
        $day = Day::findOrFail($id);
        $day->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
