<?php

namespace App\Services;

use App\Models\User;
use App\Support\ApiCache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class PremiumDowngradeService
{
    public function downgradeToFree(User $user): User
    {
        if ($user->plan !== User::PLAN_PREMIUM) {
            throw new UnprocessableEntityHttpException('Solo se puede pasar a free desde premium.');
        }

        $user->forceFill(['plan' => User::PLAN_FREE])->save();

        Log::info('plan.downgrade', [
            'user_id' => $user->id,
            'email' => $user->email,
            'from' => User::PLAN_PREMIUM,
            'to' => User::PLAN_FREE,
        ]);

        ApiCache::forgetAdminStats();
        ApiCache::forgetUserTrips((int) $user->id);

        return $user->refresh();
    }
}
