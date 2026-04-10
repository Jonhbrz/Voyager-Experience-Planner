<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'day_id' => 'sometimes|required|integer|exists:days,id',
            'from' => 'required|string|max:255',
            'to' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'duration' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ];
    }
}
