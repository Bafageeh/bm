<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->ensureSupportTables();
        $this->ensureUsersColumns();
        $this->ensureOwnersColumns();
        $this->ensureApartmentsColumns();
    }

    public function down(): void
    {
        // This migration is intentionally non-destructive because it repairs
        // production SQLite/MySQL schemas that may have been created from an
        // older deployment. Do not drop live data columns on rollback.
    }

    private function ensureSupportTables(): void
    {
        if (! Schema::hasTable('cache')) {
            Schema::create('cache', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->mediumText('value');
                $table->integer('expiration');
            });
        }

        if (! Schema::hasTable('cache_locks')) {
            Schema::create('cache_locks', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->string('owner');
                $table->integer('expiration');
            });
        }

        if (! Schema::hasTable('jobs')) {
            Schema::create('jobs', function (Blueprint $table) {
                $table->id();
                $table->string('queue')->index();
                $table->longText('payload');
                $table->unsignedTinyInteger('attempts');
                $table->unsignedInteger('reserved_at')->nullable();
                $table->unsignedInteger('available_at');
                $table->unsignedInteger('created_at');
            });
        }

        if (! Schema::hasTable('failed_jobs')) {
            Schema::create('failed_jobs', function (Blueprint $table) {
                $table->id();
                $table->string('uuid')->unique();
                $table->text('connection');
                $table->text('queue');
                $table->longText('payload');
                $table->longText('exception');
                $table->timestamp('failed_at')->useCurrent();
            });
        }

        if (! Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->morphs('tokenable');
                $table->string('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        }
    }

    private function ensureUsersColumns(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        $missing = [
            'name' => ! Schema::hasColumn('users', 'name'),
            'email' => ! Schema::hasColumn('users', 'email'),
            'username' => ! Schema::hasColumn('users', 'username'),
            'phone' => ! Schema::hasColumn('users', 'phone'),
            'role' => ! Schema::hasColumn('users', 'role'),
            'status' => ! Schema::hasColumn('users', 'status'),
            'password' => ! Schema::hasColumn('users', 'password'),
            'remember_token' => ! Schema::hasColumn('users', 'remember_token'),
        ];

        if (! in_array(true, $missing, true)) {
            return;
        }

        Schema::table('users', function (Blueprint $table) use ($missing) {
            if ($missing['name']) {
                $table->string('name')->default('مستخدم');
            }

            if ($missing['email']) {
                $table->string('email')->nullable();
            }

            if ($missing['username']) {
                $table->string('username')->nullable()->index();
            }

            if ($missing['phone']) {
                $table->string('phone')->nullable();
            }

            if ($missing['role']) {
                $table->string('role')->default('owner')->index();
            }

            if ($missing['status']) {
                $table->string('status')->default('active')->index();
            }

            if ($missing['password']) {
                $table->string('password')->default('');
            }

            if ($missing['remember_token']) {
                $table->rememberToken();
            }
        });
    }

    private function ensureOwnersColumns(): void
    {
        if (! Schema::hasTable('owners')) {
            return;
        }

        $missing = [
            'user_id' => ! Schema::hasColumn('owners', 'user_id'),
            'national_id' => ! Schema::hasColumn('owners', 'national_id'),
            'phone' => ! Schema::hasColumn('owners', 'phone'),
            'email' => ! Schema::hasColumn('owners', 'email'),
            'status' => ! Schema::hasColumn('owners', 'status'),
            'notes' => ! Schema::hasColumn('owners', 'notes'),
        ];

        if (! in_array(true, $missing, true)) {
            return;
        }

        Schema::table('owners', function (Blueprint $table) use ($missing) {
            if ($missing['user_id']) {
                $table->unsignedBigInteger('user_id')->nullable()->index();
            }

            if ($missing['national_id']) {
                $table->string('national_id')->nullable()->index();
            }

            if ($missing['phone']) {
                $table->string('phone')->nullable();
            }

            if ($missing['email']) {
                $table->string('email')->nullable();
            }

            if ($missing['status']) {
                $table->string('status')->default('active')->index();
            }

            if ($missing['notes']) {
                $table->text('notes')->nullable();
            }
        });
    }

    private function ensureApartmentsColumns(): void
    {
        if (! Schema::hasTable('apartments')) {
            return;
        }

        $missing = [
            'owner_id' => ! Schema::hasColumn('apartments', 'owner_id'),
            'floor' => ! Schema::hasColumn('apartments', 'floor'),
            'status' => ! Schema::hasColumn('apartments', 'status'),
            'notes' => ! Schema::hasColumn('apartments', 'notes'),
        ];

        if (! in_array(true, $missing, true)) {
            return;
        }

        Schema::table('apartments', function (Blueprint $table) use ($missing) {
            if ($missing['owner_id']) {
                $table->unsignedBigInteger('owner_id')->nullable()->index();
            }

            if ($missing['floor']) {
                $table->string('floor')->nullable();
            }

            if ($missing['status']) {
                $table->string('status')->default('active')->index();
            }

            if ($missing['notes']) {
                $table->text('notes')->nullable();
            }
        });
    }
};
