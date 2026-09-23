<?php

namespace App\Services;

use App\Models\Building;
use App\Models\ExpenseNotificationEvent;
use App\Models\PushToken;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpenseNotificationService
{
    private const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    public function queueForManager(Building $building, ?User $actor, string $action, string $body): ?ExpenseNotificationEvent
    {
        if (! $actor?->isManager()) {
            return null;
        }

        $scheduledFor = now()->copy()->startOfDay()->setTime(9, 0);
        if (now()->greaterThanOrEqualTo($scheduledFor)) {
            $scheduledFor->addDay();
        }

        return ExpenseNotificationEvent::create([
            'building_id' => $building->id,
            'actor_user_id' => $actor->id,
            'action' => $action,
            'title' => 'تحديث مصروفات '.$building->name,
            'body' => $body,
            'scheduled_for' => $scheduledFor,
            'attempts' => 0,
        ]);
    }

    public function sendDue(): array
    {
        $stats = ['events' => 0, 'sent' => 0, 'failed' => 0, 'no_recipients' => 0];

        ExpenseNotificationEvent::query()
            ->whereNull('sent_at')
            ->where('attempts', '<', 5)
            ->where('scheduled_for', '<=', now())
            ->orderBy('id')
            ->limit(100)
            ->get()
            ->each(function (ExpenseNotificationEvent $event) use (&$stats) {
                $stats['events']++;

                $building = $event->building;
                if (! $building) {
                    $event->update([
                        'attempts' => $event->attempts + 1,
                        'last_error' => 'Building not found.',
                    ]);
                    $stats['failed']++;
                    return;
                }

                $ownerUserIds = $building->owners()
                    ->whereNotNull('user_id')
                    ->pluck('user_id')
                    ->unique()
                    ->values();

                $tokens = PushToken::query()
                    ->whereIn('user_id', $ownerUserIds)
                    ->pluck('token')
                    ->unique()
                    ->values();

                if ($tokens->isEmpty()) {
                    $event->update([
                        'sent_at' => now(),
                        'last_error' => 'No registered owner push tokens.',
                    ]);
                    $stats['no_recipients']++;
                    return;
                }

                try {
                    foreach ($tokens->chunk(100) as $tokenChunk) {
                        $messages = $tokenChunk->map(fn (string $token) => [
                            'to' => $token,
                            'sound' => 'default',
                            'title' => $event->title,
                            'body' => $event->body,
                            'priority' => 'high',
                            'channelId' => 'bm-main-alerts',
                            'data' => [
                                'type' => 'expense_update',
                                'building_id' => $building->id,
                                'tab' => 'expenses',
                            ],
                        ])->values()->all();

                        $response = Http::timeout(20)
                            ->acceptJson()
                            ->asJson()
                            ->post(self::EXPO_PUSH_URL, $messages);

                        if (! $response->successful()) {
                            throw new \RuntimeException('Expo push HTTP '.$response->status().': '.$response->body());
                        }

                        $results = collect($response->json('data') ?? []);
                        foreach ($results as $index => $result) {
                            $token = $tokenChunk->values()->get($index);
                            $error = $result['details']['error'] ?? null;
                            if ($error === 'DeviceNotRegistered' && $token) {
                                PushToken::where('token', $token)->delete();
                            }
                        }
                    }

                    $event->update([
                        'sent_at' => now(),
                        'last_error' => null,
                    ]);
                    $stats['sent']++;
                } catch (\Throwable $e) {
                    $attempts = $event->attempts + 1;
                    $event->update([
                        'attempts' => $attempts,
                        'last_error' => mb_substr($e->getMessage(), 0, 1000),
                    ]);
                    Log::warning('BM expense owner push notification failed.', [
                        'event_id' => $event->id,
                        'building_id' => $building->id,
                        'attempts' => $attempts,
                        'error' => $e->getMessage(),
                    ]);
                    $stats['failed']++;
                }
            });

        return $stats;
    }
}
