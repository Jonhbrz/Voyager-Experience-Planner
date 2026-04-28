<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

final class ApiCache
{
    public const SHORT_TTL_SECONDS = 60;

    public static function adminStatsKey(): string
    {
        return 'api:admin:stats';
    }

    public static function userTripsKey(int $userId): string
    {
        return "api:user:{$userId}:trips";
    }

    public static function forgetAdminStats(): void
    {
        Cache::forget(self::adminStatsKey());
    }

    public static function forgetUserTrips(int $userId): void
    {
        Cache::forget(self::userTripsKey($userId));
    }
}
