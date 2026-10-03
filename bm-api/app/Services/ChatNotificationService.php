<?php

namespace App\Services;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\PushToken;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatNotificationService
{
    private const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    public function send(ChatConversation $conversation, ChatMessage $message): void
    {
        $message->loadMissing('sender');
        $senderName = $message->sender?->name ?: 'مالك';
        $recipientIds = $conversation->participants()
            ->where('users.id', '!=', $message->user_id)
            ->pluck('users.id')
            ->unique()
            ->values();

        if ($recipientIds->isEmpty()) return;

        $title = $conversation->title ?: 'رسالة جديدة من '.$senderName;
        $body = mb_strlen($message->body) > 120 ? mb_substr($message->body, 0, 117).'...' : $message->body;

        foreach ($recipientIds as $userId) {
            UserNotification::create([
                'user_id' => $userId,
                'building_id' => $conversation->building_id,
                'source_type' => 'chat_message',
                'source_id' => $message->id,
                'type' => 'chat_message',
                'title' => $title,
                'body' => $body,
                'data' => [
                    'building_id' => $conversation->building_id,
                    'conversation_id' => $conversation->id,
                    'tab' => 'chat',
                ],
            ]);
        }

        $tokens = PushToken::query()
            ->whereIn('user_id', $recipientIds)
            ->pluck('token')
            ->unique()
            ->values();

        if ($tokens->isEmpty()) return;

        try {
            foreach ($tokens->chunk(100) as $chunk) {
                $payload = $chunk->map(fn ($token) => [
                    'to' => $token,
                    'sound' => 'default',
                    'title' => $title,
                    'body' => $body,
                    'priority' => 'high',
                    'channelId' => 'bm-main-alerts',
                    'data' => [
                        'type' => 'chat_message',
                        'building_id' => $conversation->building_id,
                        'conversation_id' => $conversation->id,
                        'tab' => 'chat',
                    ],
                ])->values()->all();

                $response = Http::timeout(20)->acceptJson()->asJson()->post(self::EXPO_PUSH_URL, $payload);
                if (! $response->successful()) {
                    throw new \RuntimeException('Expo push HTTP '.$response->status());
                }

                $results = collect($response->json('data') ?? []);
                foreach ($results as $index => $result) {
                    $token = $chunk->values()->get($index);
                    if (($result['details']['error'] ?? null) === 'DeviceNotRegistered' && $token) {
                        PushToken::where('token', $token)->delete();
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('BM chat push notification failed.', [
                'conversation_id' => $conversation->id,
                'message_id' => $message->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
