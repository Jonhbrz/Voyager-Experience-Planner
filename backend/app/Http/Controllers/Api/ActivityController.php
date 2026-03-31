<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function store(Request $request, $dayId)
    {
        $order = Activity::where('day_id', $dayId)->count();

        $activity = Activity::create([
            'day_id' => $dayId,
            'title' => $request->title,
            'order' => $order
        ]);

        return $activity;
    }

    public function update(Request $request, $id)
    {
        $activity = Activity::findOrFail($id);

        $activity->update([
            'title' => $request->title
        ]);

        return $activity;
    }

    public function destroy($id)
    {
        $activity = Activity::findOrFail($id);
        $activity->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
