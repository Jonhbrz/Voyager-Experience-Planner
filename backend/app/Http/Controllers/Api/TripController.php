<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\AuthorizesOwnedApiResources;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTripRequest;
use App\Http\Requests\UpdateTripRequest;
use App\Http\Resources\TripResource;
use App\Models\Day;
use App\Models\Trip;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TripController extends Controller
{
    use AuthorizesOwnedApiResources;

    // GET /api/trips
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 0);
        $query = Trip::query()
            ->where('user_id', $request->user()->id)
            ->select(['id', 'user_id', 'name', 'description', 'start_date', 'end_date'])
            ->with([
                'days:id,trip_id,title,order',
                'days.activities:id,day_id,title,order,start_time,end_time,completed,price',
                'days.transports:id,day_id,from,to,type,price,duration,notes',
                'days.stays:id,day_id,name,location,price,check_in,check_out,notes',
            ])
            ->latest();

        if ($perPage > 0) {
            $trips = $query->paginate($perPage);
        } else {
            $trips = $query->get();
        }

        return $this->successResponse(TripResource::collection($trips), 200);
    }

    // GET /api/trips/{id}
    public function show(Request $request, $id)
    {
        $trip = $this->findTripForUserOrAbort($request, (int) $id);
        $trip->load([
            'days:id,trip_id,title,order',
            'days.activities:id,day_id,title,order,start_time,end_time,completed,price',
            'days.transports:id,day_id,from,to,type,price,duration,notes',
            'days.stays:id,day_id,name,location,price,check_in,check_out,notes',
        ]);

        return $this->successResponse(new TripResource($trip), 200);
    }

    //POST /api/trips
    public function store(StoreTripRequest $request)
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->isAdmin() && ! $user->isPremium() && $user->trips()->count() >= 3) {
            abort(403, 'Free plan users can create up to 3 trips. Upgrade to Premium to create unlimited trips.');
        }

        $trip = DB::transaction(function () use ($request) {
            $validated = $request->validated();

            if (empty($validated['start_date']) || empty($validated['end_date'])) {
                abort(422, 'Dates are required');
            }

            $start = Carbon::parse($validated['start_date']);
            $end = Carbon::parse($validated['end_date']);
            $daysCount = $start->diffInDays($end) + 1;

            $trip = Trip::create([
                ...$validated,
                'user_id' => $request->user()->id,
            ]);

            $now = now();
            $days = [];
            for ($i = 0; $i < $daysCount; $i++) {
                $days[] = [
                    'trip_id' => $trip->id,
                    'title' => 'Día '.($i + 1),
                    'order' => $i,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (!empty($days)) {
                Day::insert($days);
            }

            return $trip;
        });

        $trip->load([
            'days:id,trip_id,title,order',
            'days.activities:id,day_id,title,order,start_time,end_time,completed,price',
            'days.transports:id,day_id,from,to,type,price,duration,notes',
            'days.stays:id,day_id,name,location,price,check_in,check_out,notes',
        ]);

        return $this->successResponse(new TripResource($trip), 201);
    }

    // PUT /api/trips/{id}
    public function update(UpdateTripRequest $request, $id)
    {
        $trip = $this->findTripForUserOrAbort($request, (int) $id);
        $trip->update($request->validated());

        return $this->successResponse(new TripResource($trip), 200);
    }

    // DELETE /api/trips/{id}
    public function destroy(Request $request, $id)
    {
        $trip = $this->findTripForUserOrAbort($request, (int) $id);
        $trip->delete();

        return response()->noContent();
    }
}
