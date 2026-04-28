<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Trip;
use App\Models\User;
use App\Support\ApiCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function stats(): JsonResponse
    {
        $stats = Cache::remember(ApiCache::adminStatsKey(), ApiCache::SHORT_TTL_SECONDS, function () {
            return [
                'total_users' => User::query()->count(),
                'free_users' => User::query()->where('plan', User::PLAN_FREE)->count(),
                'premium_users' => User::query()->where('plan', User::PLAN_PREMIUM)->count(),
                'total_trips' => Trip::query()->count(),
                'total_revenue' => (int) Invoice::query()->sum('amount'),
            ];
        });

        return $this->successResponse(['stats' => $stats]);
    }

    public function users(): JsonResponse
    {
        $users = User::query()
            ->select(['id', 'name', 'email', 'role', 'plan', 'created_at'])
            ->withCount('trips')
            ->orderBy('name')
            ->get();

        return $this->successResponse(['users' => $users]);
    }

    public function updateUserPlan(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'plan' => ['required', Rule::in([User::PLAN_FREE, User::PLAN_PREMIUM])],
        ]);

        $user->forceFill(['plan' => $validated['plan']])->save();
        ApiCache::forgetAdminStats();

        return $this->successResponse([
            'user' => $this->userPayload($user->refresh()),
            'message' => 'Plan updated.',
        ]);
    }

    public function deleteUser(Request $request, User $user): JsonResponse
    {
        if ($request->user()->is($user)) {
            abort(403, 'You cannot delete your own admin account.');
        }

        $user->delete();
        ApiCache::forgetAdminStats();

        return $this->successResponse(['message' => 'User deleted.']);
    }

    public function invoices(): JsonResponse
    {
        $invoices = Invoice::query()
            ->with('user:id,name,email')
            ->latest('created_at')
            ->get(['id', 'user_id', 'amount', 'plan', 'created_at']);

        return $this->successResponse(['invoices' => $invoices]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'plan' => $user->plan,
        ];
    }
}
