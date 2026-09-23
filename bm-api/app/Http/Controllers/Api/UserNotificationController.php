<?php

namespace App\Http\Controllers\Api;

use App\Models\UserNotification;
use Illuminate\Http\Request;

class UserNotificationController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = UserNotification::where('user_id', $request->user()->id);

        return [
            'unread_count' => (clone $query)->whereNull('read_at')->count(),
            'data' => $query->latest('id')->limit(50)->get(),
        ];
    }

    public function markAllRead(Request $request)
    {
        UserNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'تم تحديث التنبيهات']);
    }
}
