<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Apartment extends Model
{
    protected $fillable = [
        'building_id',
        'owner_id',
        'number',
        'floor',
        'status',
        'notes',
    ];

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class);
    }
}
