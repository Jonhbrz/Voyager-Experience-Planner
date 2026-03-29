<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = ['day_id', 'title', 'order'];
    public function day()
    {
        return $this->belongsTo(Day::class);
    }
}
