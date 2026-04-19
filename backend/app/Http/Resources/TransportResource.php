<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'day_id' => $this->day_id,
            'from' => $this->from,
            'to' => $this->to,
            'type' => $this->type,
            'price' => round((float) ($this->price ?? 0), 2),
            'duration' => $this->duration,
            'notes' => $this->notes,
        ];
    }
}
