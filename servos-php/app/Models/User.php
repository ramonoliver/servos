<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'church_id',
    'name',
    'email',
    'phone',
    'role',
    'status',
    'avatar_color',
    'photo_url',
    'spouse_id',
    'availability',
    'total_schedules',
    'confirm_rate',
    'must_change_password',
    'last_served_at',
    'notes',
    'active',
    'joined_at',
    'password',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'availability' => 'array',
            'must_change_password' => 'boolean',
            'active' => 'boolean',
            'joined_at' => 'datetime',
            'last_served_at' => 'date',
        ];
    }

    public function church(): BelongsTo
    {
        return $this->belongsTo(Church::class);
    }

    public function spouse(): BelongsTo
    {
        return $this->belongsTo(self::class, 'spouse_id');
    }

    public function departmentMemberships(): HasMany
    {
        return $this->hasMany(DepartmentMember::class);
    }

    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class, 'department_members')
            ->withPivot(['function_name', 'function_names', 'joined_at'])
            ->withTimestamps();
    }

    public function scheduleAssignments(): HasMany
    {
        return $this->hasMany(ScheduleMember::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isLeader(): bool
    {
        return $this->role === 'leader';
    }

    public function isMember(): bool
    {
        return $this->role === 'member';
    }
}
