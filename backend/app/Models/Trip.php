<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Trip extends Model
{
    protected $fillable = ['day_id', 'title', 'order'];
    public function days()
    {
        return $this->hasMany(Day::class)->orderBy('order');
    }
}
