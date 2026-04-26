<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
{
    private const PREMIUM_AMOUNT_CENTS = 999;

    public function upgrade(Request $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            /** @var User $user */
            $user = $request->user();

            $user->forceFill(['plan' => User::PLAN_PREMIUM])->save();

            Invoice::query()->create([
                'user_id' => $user->id,
                'amount' => self::PREMIUM_AMOUNT_CENTS,
                'plan' => User::PLAN_PREMIUM,
            ]);

            return $user->refresh();
        });

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'plan' => $user->plan,
            ],
            'message' => 'Plan upgraded to premium.',
        ]);
    }
}
