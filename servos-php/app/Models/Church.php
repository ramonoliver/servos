<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Church extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'city',
        'state',
        'vision',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }
}
