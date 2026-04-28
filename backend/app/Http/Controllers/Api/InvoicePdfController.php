<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InvoicePdfController extends Controller
{
    public function show(Request $request, Invoice $invoice): Response
    {
        $actor = $request->user();

        if (! $actor->isAdmin() && $invoice->user_id !== $actor->id) {
            abort(403, 'No puedes acceder a esta factura.');
        }

        $invoice->loadMissing('user:id,name,email');

        $pdf = Pdf::loadView('invoices.pdf', [
            'invoice' => $invoice,
            'userEmail' => $invoice->user?->email ?? '—',
            'amountEur' => number_format(((int) $invoice->amount) / 100, 2, '.', ''),
            'issuedAt' => $invoice->created_at?->timezone(config('app.timezone'))->format('Y-m-d H:i') ?? '',
        ])->setPaper('a4');

        $filename = 'invoice-'.$invoice->id.'.pdf';

        return $pdf->download($filename);
    }
}
