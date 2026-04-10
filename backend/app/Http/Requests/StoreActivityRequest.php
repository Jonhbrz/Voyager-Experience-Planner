<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $start = $this->input('start_time');
            $end = $this->input('end_time');
            if ($start && $end) {
                $s = Carbon::parse('2000-01-01 '.$start);
                $e = Carbon::parse('2000-01-01 '.$end);
                if (! $e->gt($s)) {
                    $validator->errors()->add('end_time', 'La hora de fin debe ser posterior a la de inicio.');
                }
            }
        });
    }
}
