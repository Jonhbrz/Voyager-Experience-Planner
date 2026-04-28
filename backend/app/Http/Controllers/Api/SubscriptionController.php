<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PremiumDowngradeService;
use App\Services\PremiumUpgradeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function upgrade(Request $request, PremiumUpgradeService $premiumUpgrade): JsonResponse
    {
        $user = $premiumUpgrade->upgradeFromFree($request->user());

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'plan' => $user->plan,
            ],
            'message' => 'Plan actualizado a premium.',
        ]);
    }

    public function downgrade(Request $request, PremiumDowngradeService $premiumDowngrade): JsonResponse
    {
        $user = $premiumDowngrade->downgradeToFree($request->user());

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'plan' => $user->plan,
            ],
            'message' => 'Has vuelto al plan free.',
        ]);
    }
}
