<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'church_id',
        'event_id',
        'department_id',
        'date',
        'time',
        'arrival_time',
        'status',
        'instructions',
        'notes',
        'published',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'published' => 'boolean',
        ];
    }

    public function church(): BelongsTo
    {
        return $this->belongsTo(Church::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): HasMany
    {
        return $this->hasMany(ScheduleMember::class);
    }
}
