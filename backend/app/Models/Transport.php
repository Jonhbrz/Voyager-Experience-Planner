<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transport extends Model
{
    protected $fillable = [
        'day_id',
        'from',
        'to',
        'type',
        'price',
        'duration',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
        ];
    }

    public function day(): BelongsTo
    {
        return $this->belongsTo(Day::class);
    }
}
