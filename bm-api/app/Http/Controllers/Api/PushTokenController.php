<?php

namespace App\Http\Controllers\Api;

use App\Models\PushToken;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PushTokenController extends BaseApiController
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:255'],
            'platform' => ['nullable', 'string', Rule::in(['android', 'ios'])],
        ]);

        $pushToken = PushToken::updateOrCreate(
            ['token' => trim($data['token'])],
            [
                'user_id' => $request->user()->id,
                'platform' => $data['platform'] ?? null,
                'last_seen_at' => now(),
            ]
        );

        return ['data' => $pushToken];
    }

    public function destroy(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:255'],
        ]);

        PushToken::where('user_id', $request->user()->id)
            ->where('token', trim($data['token']))
            ->delete();

        return response()->json(['message' => 'تم إلغاء تسجيل جهاز التنبيهات']);
    }
}
