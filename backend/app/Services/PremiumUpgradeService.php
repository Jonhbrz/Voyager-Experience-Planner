<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\User;
use App\Support\ApiCache;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class PremiumUpgradeService
{
    private const PREMIUM_AMOUNT_CENTS = 999;

    public function upgradeFromFree(User $user): User
    {
        if ($user->plan !== User::PLAN_FREE) {
            throw new UnprocessableEntityHttpException('Solo se puede mejorar el plan cuando estás en free.');
        }

        return DB::transaction(function () use ($user) {
            $user->forceFill(['plan' => User::PLAN_PREMIUM])->save();

            Invoice::query()->create([
                'user_id' => $user->id,
                'amount' => self::PREMIUM_AMOUNT_CENTS,
                'plan' => User::PLAN_PREMIUM,
            ]);

            ApiCache::forgetAdminStats();
            ApiCache::forgetUserTrips((int) $user->id);

            return $user->refresh();
        });
    }
}
