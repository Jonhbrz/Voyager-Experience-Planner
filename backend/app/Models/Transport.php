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
        'duration',
        'notes',
    ];

    public function day(): BelongsTo
    {
        return $this->belongsTo(Day::class);
    }
}
