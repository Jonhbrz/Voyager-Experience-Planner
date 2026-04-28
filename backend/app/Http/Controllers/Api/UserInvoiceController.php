<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserInvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $invoices = Invoice::query()
            ->where('user_id', $userId)
            ->latest('created_at')
            ->get(['id', 'amount', 'plan', 'created_at']);

        return $this->successResponse(['invoices' => $invoices]);
    }
}
