<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Expense extends Model
{
    protected $fillable = [
        'building_id',
        'category',
        'amount',
        'expense_date',
        'description',
        'attachment_path',
        'scope',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expense_date' => 'date:Y-m-d',
        ];
    }

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function owners(): BelongsToMany
    {
        return $this->belongsToMany(Owner::class, 'expense_owner')
            ->withPivot('share_amount')
            ->withTimestamps();
    }
}
