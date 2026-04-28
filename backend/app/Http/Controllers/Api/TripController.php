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
use Illuminate\Http\JsonResponse;
use App\Support\ApiCache;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TripController extends Controller
{
    use AuthorizesOwnedApiResources;

    private const TRIP_RELATIONS = [
        'days:id,trip_id,title,order',
        'days.activities:id,day_id,title,order,start_time,end_time,completed,price',
        'days.transports:id,day_id,from,to,type,price,duration,notes',
        'days.stays:id,day_id,name,location,price,check_in,check_out,notes',
    ];

    // GET /api/trips
    public function index(Request $request)
    {
        $userId = (int) $request->user()->id;
        $perPage = (int) $request->query('per_page', 0);

        if ($perPage === 0) {
            $trips = Cache::remember(ApiCache::userTripsKey($userId), ApiCache::SHORT_TTL_SECONDS, function () use ($request, $userId) {
                return TripResource::collection($this->tripIndexQuery($userId)->get())->resolve($request);
            });

            return $this->successResponse($trips, 200);
        }

        $trips = $this->tripIndexQuery($userId)->paginate($perPage);

        return $this->successResponse(TripResource::collection($trips), 200);
    }

    private function tripIndexQuery(int $userId)
    {
        $query = Trip::query()
            ->where('user_id', $userId)
            ->select(['id', 'user_id', 'name', 'description', 'start_date', 'end_date'])
            ->with(self::TRIP_RELATIONS)
            ->latest();

        return $query;
    }

    // GET /api/trips/{id}
    public function show(Request $request, $id)
    {
        $trip = $this->findTripForUserOrAbort($request, (int) $id);
        $trip->load(self::TRIP_RELATIONS);

        return $this->successResponse(new TripResource($trip), 200);
    }

    //POST /api/trips
    public function store(StoreTripRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $tripsCount = Trip::query()->where('user_id', $user->id)->count();

        if (! $user->isAdmin() && ! $user->isPremium() && $tripsCount >= 3) {
            abort(403, 'Has alcanzado el límite de viajes del plan Free');
        }

        $trip = DB::transaction(function () use ($request) {
            $validated = $request->validated();

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

            if ($days !== []) {
                Day::insert($days);
            }

            return $trip;
        });

        ApiCache::forgetUserTrips((int) $request->user()->id);
        ApiCache::forgetAdminStats();
        $trip->load(self::TRIP_RELATIONS);

        return response()->json([
            'success' => true,
            'message' => 'Viaje creado correctamente.',
            'data' => (new TripResource($trip))->resolve($request),
        ], 201);
    }

    // PUT /api/trips/{id}
    public function update(UpdateTripRequest $request, $id)
    {
        $trip = $this->findTripForUserOrAbort($request, (int) $id);
        $trip->update($request->validated());
        ApiCache::forgetUserTrips((int) $request->user()->id);

        return $this->successResponse(new TripResource($trip), 200);
    }

    // DELETE /api/trips/{id}
    public function destroy(Request $request, $id)
    {
        $trip = $this->findTripForUserOrAbort($request, (int) $id);
        $trip->delete();
        ApiCache::forgetUserTrips((int) $request->user()->id);
        ApiCache::forgetAdminStats();

        return response()->noContent();
    }
}
