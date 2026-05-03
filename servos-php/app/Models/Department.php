<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'church_id',
        'name',
        'description',
        'icon',
        'color',
        'function_names',
        'leader_ids',
        'co_leader_ids',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'function_names' => 'array',
            'leader_ids' => 'array',
            'co_leader_ids' => 'array',
            'active' => 'boolean',
        ];
    }

    public function church(): BelongsTo
    {
        return $this->belongsTo(Church::class);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(DepartmentMember::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'department_members')
            ->withPivot(['function_name', 'function_names', 'joined_at'])
            ->withTimestamps();
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }
}
