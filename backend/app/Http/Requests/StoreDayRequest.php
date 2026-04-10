<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'trip_id' => 'sometimes|required|integer|exists:trips,id',
            'title' => 'required|string|max:255',
            'order' => 'sometimes|required|integer|min:0',
        ];
    }
}
