<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Activity extends Model
{
    protected $fillable = [
        'day_id',
        'title',
        'order',
        'start_time',
        'end_time',
        'completed',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
            'completed' => 'boolean',
        ];
    }

    public function day(): BelongsTo
    {
        return $this->belongsTo(Day::class);
    }
}
