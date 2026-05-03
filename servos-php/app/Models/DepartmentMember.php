<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class DepartmentMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'user_id',
        'function_name',
        'function_names',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'function_names' => 'array',
            'joined_at' => 'date',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
