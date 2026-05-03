<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'church_id',
        'name',
        'description',
        'type',
        'icon',
        'location',
        'base_time',
        'instructions',
        'recurrence',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }

    public function church(): BelongsTo
    {
        return $this->belongsTo(Church::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }
}
