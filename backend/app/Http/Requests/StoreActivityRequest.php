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
        if ($this->has('start_time') && is_string($this->start_time)) {
            $n = self::normalizeTime($this->start_time);
            if ($n !== null) {
                $this->merge(['start_time' => $n]);
            }
        }
        if ($this->filled('end_time') && is_string($this->end_time)) {
            $n = self::normalizeTime($this->end_time);
            if ($n !== null) {
                $this->merge(['end_time' => $n]);
            }
        }
    }

    /**
     * Acepta "9:30" además de "09:30" para validación H:i.
     */
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
            'title' => 'required|string|max:255',
            'order' => 'sometimes|integer|min:0',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'completed' => 'sometimes|boolean',
            'price' => 'sometimes|numeric|min:0|max:999999.99',
        ];
    }
}
