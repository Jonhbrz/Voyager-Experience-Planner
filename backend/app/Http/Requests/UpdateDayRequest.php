<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'trip_id' => 'sometimes|required|integer|exists:trips,id',
            'title' => 'sometimes|required|string|max:255',
            'order' => 'sometimes|required|integer|min:0',
        ];
    }
}
