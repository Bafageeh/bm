<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ExpenseOwnerDue extends Model
{
    protected $fillable = [
        'expense_id',
        'building_id',
        'owner_id',
        'amount',
        'status',
        'payment_method',
        'payment_date',
        'owner_notes',
        'receipt_path',
        'receipt_original_name',
        'receipt_mime_type',
        'receipt_token',
        'submitted_at',
        'verified_at',
        'verified_by_user_id',
        'manager_notes',
        'owner_payment_id',
    ];

    protected $hidden = [
        'receipt_path',
        'receipt_token',
    ];

    protected $appends = [
        'receipt_url',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_date' => 'date:Y-m-d',
            'submitted_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::deleted(function (ExpenseOwnerDue $due) {
            if ($due->receipt_path) {
                Storage::disk('local')->delete($due->receipt_path);
            }
        });
    }

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_user_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(OwnerPayment::class, 'owner_payment_id');
    }

    public function getReceiptUrlAttribute(): ?string
    {
        if (! $this->receipt_path || ! $this->receipt_token) {
            return null;
        }

        return '/expense-due-receipts/'.$this->id.'/'.$this->receipt_token;
    }
}
