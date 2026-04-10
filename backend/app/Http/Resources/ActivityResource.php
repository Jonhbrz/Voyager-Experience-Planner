<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'day_id' => $this->day_id,
            'title' => $this->title,
            'order' => $this->order,
            'start_time' => $this->formatTime($this->start_time),
            'end_time' => $this->formatTime($this->end_time),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function formatTime(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value->format('H:i');
        }

        if (is_string($value)) {
            return strlen($value) >= 5 ? substr($value, 0, 5) : $value;
        }

        return null;
    }
}
