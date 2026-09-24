<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ExpenseAttachment extends Model
{
    protected $fillable = [
        'expense_id',
        'original_name',
        'display_name',
        'mime_type',
        'size',
        'path',
        'public_token',
    ];

    protected $hidden = [
        'path',
        'public_token',
    ];

    protected $appends = [
        'url',
    ];

    protected static function booted(): void
    {
        static::deleted(function (ExpenseAttachment $attachment) {
            if ($attachment->path) {
                Storage::disk('local')->delete($attachment->path);
            }
        });
    }

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }

    public function getUrlAttribute(): string
    {
        return '/expense-attachments/'.$this->id.'/'.$this->public_token;
    }
}
