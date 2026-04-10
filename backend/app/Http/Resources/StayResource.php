<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StayResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'day_id' => $this->day_id,
            'name' => $this->name,
            'location' => $this->location,
            'check_in' => $this->check_in?->toIso8601String(),
            'check_out' => $this->check_out?->toIso8601String(),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
