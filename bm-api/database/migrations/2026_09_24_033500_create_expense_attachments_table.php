<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expense_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expense_id')->constrained()->cascadeOnDelete();
            $table->string('original_name');
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('size')->default(0);
            $table->string('path');
            $table->string('public_token', 64)->unique();
            $table->timestamps();

            $table->index(['expense_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_attachments');
    }
};
