<?php

namespace App\Http\Requests;

use App\Models\Activity;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('end_time') && $this->end_time === '') {
            $this->merge(['end_time' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'day_id' => 'sometimes|required|integer|exists:days,id',
            'title' => 'sometimes|required|string|max:255',
            'order' => 'sometimes|required|integer|min:0',
            'start_time' => 'sometimes|required|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $activity = Activity::find($this->route('id'));
            if (! $activity) {
                return;
            }

            $startInput = $this->input('start_time');
            $startStr = $startInput;
            if ($startStr === null) {
                $st = $activity->start_time;
                $startStr = $st instanceof Carbon ? $st->format('H:i') : (string) $st;
            }

            $payload = $this->all();
            if (array_key_exists('end_time', $payload)) {
                $end = $payload['end_time'];
            } else {
                $et = $activity->end_time;
                $end = $et instanceof Carbon ? $et->format('H:i') : $et;
            }

            if ($startStr && $end) {
                $s = Carbon::parse('2000-01-01 '.$startStr);
                $e = Carbon::parse('2000-01-01 '.$end);
                if (! $e->gt($s)) {
                    $validator->errors()->add('end_time', 'La hora de fin debe ser posterior a la de inicio.');
                }
            }
        });
    }
}
