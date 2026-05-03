<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class ScheduleMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'schedule_id',
        'user_id',
        'function_name',
        'status',
        'decline_reason',
        'substitute_id',
        'is_reserve',
        'responded_at',
    ];

    protected function casts(): array
    {
        return [
            'is_reserve' => 'boolean',
            'responded_at' => 'datetime',
        ];
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function substitute(): BelongsTo
    {
        return $this->belongsTo(User::class, 'substitute_id');
    }
}
