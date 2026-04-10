<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreStayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'day_id' => 'sometimes|required|integer|exists:days,id',
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'check_in' => 'nullable|date',
            'check_out' => 'nullable|date',
            'notes' => 'nullable|string',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $in = $this->input('check_in');
            $out = $this->input('check_out');
            if ($in && $out && strtotime((string) $out) <= strtotime((string) $in)) {
                $validator->errors()->add('check_out', 'La salida debe ser posterior al check-in.');
            }
        });
    }
}
