<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Stay extends Model
{
    protected $fillable = [
        'day_id',
        'name',
        'location',
        'price',
        'check_in',
        'check_out',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'check_in' => 'datetime',
            'check_out' => 'datetime',
        ];
    }

    public function day(): BelongsTo
    {
        return $this->belongsTo(Day::class);
    }
}
