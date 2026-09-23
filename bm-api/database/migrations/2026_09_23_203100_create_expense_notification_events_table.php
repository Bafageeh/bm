<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('expense_notification_events')) {
            return;
        }

        Schema::create('expense_notification_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('building_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 50);
            $table->string('title', 255);
            $table->text('body');
            $table->timestamp('scheduled_for');
            $table->timestamp('sent_at')->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamps();
            $table->index(['scheduled_for', 'sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_notification_events');
    }
};
