<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateActivityRequest extends FormRequest
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
        foreach (['start_time', 'end_time'] as $field) {
            if (! $this->has($field)) {
                continue;
            }
            $v = $this->input($field);
            if ($v === null || $v === '') {
                if ($field === 'end_time') {
                    $this->merge(['end_time' => null]);
                }

                continue;
            }
            if (! is_string($v)) {
                continue;
            }
            $n = self::normalizeTime($v);
            if ($n !== null) {
                $this->merge([$field => $n]);
            }
        }
    }

    private static function normalizeTime(string $raw): ?string
    {
        $s = trim($raw);
        if ($s === '') {
            return null;
        }
        if (! preg_match('/^(\d{1,2}):([0-5]\d)$/', $s, $m)) {
            return null;
        }
        $h = (int) $m[1];
        $min = $m[2];
        if ($h < 0 || $h > 23) {
            return null;
        }

        return sprintf('%02d:%s', $h, $min);
    }

    public function rules(): array
    {
        return [
            'day_id' => 'sometimes|required|integer|exists:days,id',
            'title' => 'sometimes|required|string|max:255',
            'order' => 'sometimes|required|integer|min:0',
            'start_time' => 'sometimes|required|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'completed' => 'sometimes|boolean',
            'price' => 'sometimes|numeric|min:0|max:999999.99',
        ];
    }
}
