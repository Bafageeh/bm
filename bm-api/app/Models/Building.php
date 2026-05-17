<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Building extends Model
{
    protected $fillable = [
        'name',
        'district',
        'city',
        'address',
        'annual_cycle_starts_on',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'annual_cycle_starts_on' => 'date',
        ];
    }

    public function managers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'building_managers')
            ->withPivot(['role'])
            ->withTimestamps();
    }

    public function apartments(): HasMany
    {
        return $this->hasMany(Apartment::class);
    }

    public function owners(): HasMany
    {
        return $this->hasMany(Owner::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(OwnerPayment::class);
    }
}
