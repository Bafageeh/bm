<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ManagerRegistrationController extends BaseApiController
{
    public function requestOtp(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'building_name' => ['required', 'string', 'max:255'],
            'unit_count' => ['required', 'integer', 'min:1', 'max:1000'],
            'annual_cycle_starts_on' => ['required', 'date'],
            'national_id' => ['required', 'string', 'max:50', Rule::unique('users', 'username')],
            'phone' => ['required', 'string', 'max:50', Rule::unique('users', 'phone')],
        ], [
            'name.required' => 'أدخل الاسم.',
            'building_name.required' => 'أدخل اسم المبنى.',
            'unit_count.required' => 'أدخل عدد الوحدات.',
            'annual_cycle_starts_on.required' => 'أدخل بداية تاريخ الدورة.',
            'national_id.required' => 'أدخل رقم الهوية.',
            'national_id.unique' => 'رقم الهوية مسجل مسبقًا.',
            'phone.required' => 'أدخل رقم الجوال.',
            'phone.unique' => 'رقم الجوال مسجل مسبقًا.',
        ]);

        $registrationId = (string) Str::uuid();
        $otp = (string) random_int(100000, 999999);
        $payload = $data;
        $payload['otp'] = $otp;
        $payload['attempts'] = 0;

        Cache::put($this->cacheKey($registrationId), $payload, now()->addMinutes(10));
        $sent = $this->sendOtp($data['phone'], $otp);

        return [
            'registration_id' => $registrationId,
            'message' => $sent ? 'تم إرسال رمز التحقق على الواتساب.' : 'تم إنشاء رمز التحقق لكن مزود الواتساب غير مضبوط بعد.',
            'whatsapp_sent' => $sent,
            'expires_in_seconds' => 600,
        ];
    }

    public function verify(Request $request)
    {
        $data = $request->validate([
            'registration_id' => ['required', 'string'],
            'otp' => ['required', 'string', 'size:6'],
        ], [
            'registration_id.required' => 'جلسة التسجيل غير موجودة.',
            'otp.required' => 'أدخل رمز التحقق.',
            'otp.size' => 'رمز التحقق يجب أن يكون 6 أرقام.',
        ]);

        $key = $this->cacheKey($data['registration_id']);
        $payload = Cache::get($key);

        if (! $payload) {
            throw ValidationException::withMessages([
                'otp' => ['انتهت صلاحية رمز التحقق، ابدأ التسجيل مرة أخرى.'],
            ]);
        }

        if (($payload['otp'] ?? null) !== $data['otp']) {
            $payload['attempts'] = (int) ($payload['attempts'] ?? 0) + 1;
            Cache::put($key, $payload, now()->addMinutes(10));

            throw ValidationException::withMessages([
                'otp' => ['رمز التحقق غير صحيح، قم بإدخاله مرة أخرى.'],
            ]);
        }

        [$user, $building] = DB::transaction(function () use ($payload) {
            $user = User::create([
                'name' => $payload['name'],
                'username' => $payload['national_id'],
                'phone' => $payload['phone'],
                'role' => 'manager',
                'password' => Hash::make('123456'),
                'status' => 'active',
            ]);

            $building = Building::create([
                'name' => $payload['building_name'],
                'annual_cycle_starts_on' => $payload['annual_cycle_starts_on'],
                'status' => 'active',
            ]);

            $building->managers()->attach($user->id, ['role' => 'manager']);

            for ($i = 1; $i <= (int) $payload['unit_count']; $i++) {
                $building->apartments()->create([
                    'number' => (string) $i,
                    'status' => 'active',
                ]);
            }

            return [$user, $building];
        });

        Cache::forget($key);

        return [
            'message' => 'تم التسجيل بنجاح.',
            'default_password' => '123456',
            'token' => $user->createToken('bm-mobile')->plainTextToken,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'phone' => $user->phone,
                'role' => $user->role,
                'buildings' => [[
                    'id' => $building->id,
                    'name' => $building->name,
                    'district' => $building->district,
                    'city' => $building->city,
                ]],
            ],
        ];
    }

    private function cacheKey(string $registrationId): string
    {
        return 'manager_registration:'.$registrationId;
    }

    private function sendOtp(string $phone, string $otp): bool
    {
        $url = env('WHATSAPP_URL');
        if (! $url) {
            Log::warning('WhatsApp URL is not configured for manager registration OTP.', ['phone' => $phone]);
            return false;
        }

        try {
            $headers = [];
            if ($token = (env('WHATSAPP_TOKEN') ?: env('WHATSAPP_API_KEY'))) {
                $headers['Authorization'] = 'Bearer '.$token;
            }

            $response = Http::timeout((int) env('WHATSAPP_HTTP_TIMEOUT', 15))->withHeaders($headers)->post($url, [
                'phone' => $phone,
                'to' => $phone,
                'message' => 'رمز التحقق لتسجيل مدير اتحاد الملاك هو: '.$otp,
                'body' => 'رمز التحقق لتسجيل مدير اتحاد الملاك هو: '.$otp,
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::warning('WhatsApp sending failed', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
