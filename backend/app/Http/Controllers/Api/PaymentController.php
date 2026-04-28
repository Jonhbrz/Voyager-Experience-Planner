<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PremiumUpgradeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function simulate(Request $request, PremiumUpgradeService $premiumUpgrade): JsonResponse
    {
        $base = $request->validate([
            'method' => ['required', 'string', Rule::in(['card', 'transfer'])],
            'payment_data' => ['required', 'array'],
        ]);

        if ($base['method'] === 'card') {
            $request->validate([
                'payment_data.holder_name' => ['required', 'string', 'max:120'],
                'payment_data.card_number' => ['required', 'string', 'regex:/^\d{13,19}$/'],
                'payment_data.expiry' => ['required', 'string', 'regex:/^(0[1-9]|1[0-2])\/\d{2}$/'],
                'payment_data.cvv' => ['required', 'string', 'regex:/^\d{3,4}$/'],
            ]);
        } else {
            $request->validate([
                'payment_data.iban' => ['required', 'string', 'min:15', 'max:34'],
                'payment_data.holder_name' => ['required', 'string', 'max:120'],
                'payment_data.amount' => ['required', 'string', 'max:32'],
            ]);
        }

        $user = $premiumUpgrade->upgradeFromFree($request->user());

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'plan' => $user->plan,
            ],
            'message' => 'Pago simulado correctamente. Plan actualizado a premium.',
        ]);
    }
}
