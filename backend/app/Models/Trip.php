<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Trip extends Model
{
    protected $fillable = ['name', 'description'];

    public function days()
    {
        return $this->hasMany(Day::class)->orderBy('order');
    }
}
