<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateStayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'location' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|numeric|min:0|max:999999.99',
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
