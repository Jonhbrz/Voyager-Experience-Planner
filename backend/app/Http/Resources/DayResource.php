<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DayResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'trip_id' => $this->trip_id,
            'title' => $this->title,
            'order' => $this->order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'activities' => ActivityResource::collection($this->whenLoaded('activities')),
            'transports' => TransportResource::collection($this->whenLoaded('transports')),
            'stays' => StayResource::collection($this->whenLoaded('stays')),
        ];
    }
}
