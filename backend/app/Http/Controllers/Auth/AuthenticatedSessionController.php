<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthenticatedSessionController extends Controller
{
    private const TOKEN_NAME = 'auth_token';

    public function store(LoginRequest $request): JsonResponse
    {
        $user = $request->authenticate();

        return $this->successResponse([
            'user' => $this->userPayload($user),
            'token' => $user->createToken(self::TOKEN_NAME, [], now()->addDays(7))->plainTextToken,
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return $this->successResponse(['message' => 'Logged out.']);
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
