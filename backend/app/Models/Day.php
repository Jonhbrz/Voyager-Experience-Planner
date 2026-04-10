<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Day extends Model
{
    protected $fillable = ['trip_id', 'title', 'order'];

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class)->orderBy('start_time')->orderBy('order');
    }

    public function transports(): HasMany
    {
        return $this->hasMany(Transport::class)->orderBy('id');
    }

    public function stays(): HasMany
    {
        return $this->hasMany(Stay::class)->orderBy('id');
    }
}
