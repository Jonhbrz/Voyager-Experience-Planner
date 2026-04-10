<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'day_id' => 'sometimes|required|integer|exists:days,id',
            'title' => 'sometimes|required|string|max:255',
            'order' => 'sometimes|required|integer|min:0',
        ];
    }
}
