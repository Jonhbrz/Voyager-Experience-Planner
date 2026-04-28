<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Factura #{{ $invoice->id }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111; }
        h1 { font-size: 18px; margin: 0 0 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
        th { background: #f5f5f5; }
        .muted { color: #555; font-size: 11px; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>Voyager Experience Planner</h1>
    <p><strong>Factura #{{ $invoice->id }}</strong></p>
    <table>
        <tr>
            <th>Email</th>
            <td>{{ $userEmail }}</td>
        </tr>
        <tr>
            <th>Plan</th>
            <td>{{ $invoice->plan }}</td>
        </tr>
        <tr>
            <th>Importe</th>
            <td>€{{ $amountEur }} EUR</td>
        </tr>
        <tr>
            <th>Fecha</th>
            <td>{{ $issuedAt }}</td>
        </tr>
    </table>
    <p class="muted">Recibo simulado solo para demostración.</p>
</body>
</html>
