<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('end_time') && ($this->end_time === '' || $this->end_time === null)) {
            $this->merge(['end_time' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'day_id' => 'sometimes|required|integer|exists:days,id',
            'title' => 'required|string|max:255',
            'order' => 'sometimes|required|integer|min:0',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'completed' => 'sometimes|boolean',
            'price' => 'sometimes|numeric|min:0|max:999999.99',
        ];
    }
}
