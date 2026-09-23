<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_notifications')) {
            return;
        }

        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('building_id')->nullable()->constrained()->nullOnDelete();
            $table->string('source_type', 50)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('type', 50)->default('general');
            $table->string('title', 255);
            $table->text('body');
            $table->text('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'source_type', 'source_id']);
            $table->index(['user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
    }
};
