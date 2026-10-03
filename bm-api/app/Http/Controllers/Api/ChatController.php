<?php

namespace App\Http\Controllers\Api;

use App\Models\Building;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Services\ChatNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ChatController extends BaseApiController
{
    public function index(Request $request, Building $building)
    {
        $this->assertCanAccessBuilding($request, $building);
        $userId = $request->user()->id;

        $conversations = ChatConversation::query()
            ->where('building_id', $building->id)
            ->whereHas('participants', fn ($query) => $query->where('users.id', $userId))
            ->with([
                'participants:id,name,username,phone',
                'messages' => fn ($query) => $query->with('sender:id,name')->latest('id')->limit(1),
            ])
            ->latest('updated_at')
            ->get()
            ->map(fn (ChatConversation $conversation) => $this->conversationPayload($conversation, $userId));

        return ['data' => $conversations];
    }

    public function recipients(Request $request, Building $building)
    {
        $this->assertCanAccessBuilding($request, $building);
        $userId = $request->user()->id;

        $owners = $building->owners()
            ->whereNotNull('user_id')
            ->with('user:id,name,status')
            ->orderBy('name')
            ->get()
            ->filter(fn ($owner) => $owner->user && $owner->user->status === 'active' && (int) $owner->user_id !== (int) $userId)
            ->unique('user_id')
            ->values()
            ->map(fn ($owner) => [
                'owner_id' => $owner->id,
                'user_id' => $owner->user_id,
                'name' => $owner->name,
                'apartments' => $owner->apartments()->orderByRaw('CAST(number AS UNSIGNED), number')->pluck('number')->values(),
                'is_manager' => $building->managers()->whereKey($owner->user_id)->exists(),
            ]);

        return ['data' => $owners];
    }

    public function store(Request $request, Building $building)
    {
        $this->assertCanAccessBuilding($request, $building);

        $data = $request->validate([
            'recipient_user_ids' => ['required', 'array', 'min:1'],
            'recipient_user_ids.*' => ['integer'],
            'title' => ['nullable', 'string', 'max:120'],
            'message' => ['nullable', 'string', 'max:5000'],
        ], [
            'recipient_user_ids.required' => 'اختر مستلمًا واحدًا على الأقل.',
            'recipient_user_ids.min' => 'اختر مستلمًا واحدًا على الأقل.',
        ]);

        $senderId = (int) $request->user()->id;
        $recipientIds = collect($data['recipient_user_ids'])
            ->map(fn ($id) => (int) $id)
            ->reject(fn ($id) => $id === $senderId)
            ->unique()
            ->values();

        $validRecipientIds = $building->owners()
            ->whereNotNull('user_id')
            ->whereIn('user_id', $recipientIds)
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($validRecipientIds->count() !== $recipientIds->count() || $recipientIds->isEmpty()) {
            throw ValidationException::withMessages([
                'recipient_user_ids' => ['يجب اختيار ملاك تابعين لنفس المبنى فقط.'],
            ]);
        }

        [$conversation, $firstMessage] = DB::transaction(function () use ($building, $senderId, $recipientIds, $data) {
            $conversation = ChatConversation::create([
                'building_id' => $building->id,
                'created_by' => $senderId,
                'title' => trim((string) ($data['title'] ?? '')) ?: null,
            ]);

            $participantIds = $recipientIds->push($senderId)->unique()->values();
            $sync = $participantIds->mapWithKeys(fn ($id) => [$id => [
                'last_read_at' => (int) $id === $senderId ? now() : null,
            ]])->all();
            $conversation->participants()->sync($sync);

            $messageText = trim((string) ($data['message'] ?? ''));
            $message = null;
            if ($messageText !== '') {
                $message = $conversation->messages()->create([
                    'user_id' => $senderId,
                    'body' => $messageText,
                ]);
                $conversation->touch();
            }

            return [$conversation, $message];
        });

        if ($firstMessage) {
            app(ChatNotificationService::class)->send($conversation, $firstMessage);
        }

        $conversation->load('participants:id,name,username,phone');
        return response()->json([
            'data' => $this->conversationPayload($conversation, $senderId),
        ], 201);
    }

    public function show(Request $request, Building $building, ChatConversation $conversation)
    {
        $this->assertConversationAccess($request, $building, $conversation);
        $userId = $request->user()->id;

        DB::table('chat_participants')
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $userId)
            ->update(['last_read_at' => now(), 'updated_at' => now()]);

        $conversation->load('participants:id,name,username,phone');
        $messages = $conversation->messages()
            ->with('sender:id,name')
            ->orderBy('id')
            ->limit(300)
            ->get()
            ->map(fn (ChatMessage $message) => [
                'id' => $message->id,
                'body' => $message->body,
                'user_id' => $message->user_id,
                'sender_name' => $message->sender?->name ?: 'مستخدم',
                'is_mine' => (int) $message->user_id === (int) $userId,
                'created_at' => optional($message->created_at)->toIso8601String(),
            ]);

        return [
            'data' => [
                'conversation' => $this->conversationPayload($conversation, $userId),
                'messages' => $messages,
            ],
        ];
    }

    public function send(Request $request, Building $building, ChatConversation $conversation)
    {
        $this->assertConversationAccess($request, $building, $conversation);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ], [
            'body.required' => 'اكتب الرسالة.',
        ]);

        $body = trim($data['body']);
        if ($body === '') {
            throw ValidationException::withMessages(['body' => ['اكتب الرسالة.']]);
        }

        $message = $conversation->messages()->create([
            'user_id' => $request->user()->id,
            'body' => $body,
        ]);
        $conversation->touch();

        DB::table('chat_participants')
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $request->user()->id)
            ->update(['last_read_at' => now(), 'updated_at' => now()]);

        app(ChatNotificationService::class)->send($conversation, $message);

        $message->load('sender:id,name');
        return response()->json([
            'data' => [
                'id' => $message->id,
                'body' => $message->body,
                'user_id' => $message->user_id,
                'sender_name' => $message->sender?->name ?: 'مستخدم',
                'is_mine' => true,
                'created_at' => optional($message->created_at)->toIso8601String(),
            ],
        ], 201);
    }

    private function assertConversationAccess(Request $request, Building $building, ChatConversation $conversation): void
    {
        $this->assertCanAccessBuilding($request, $building);
        abort_unless((int) $conversation->building_id === (int) $building->id, 404, 'المحادثة غير موجودة.');
        abort_unless(
            $conversation->participants()->where('users.id', $request->user()->id)->exists(),
            403,
            'لست مشاركًا في هذه المحادثة.'
        );
    }

    private function conversationPayload(ChatConversation $conversation, int $userId): array
    {
        $conversation->loadMissing('participants:id,name,username,phone');
        $lastMessage = $conversation->relationLoaded('messages')
            ? $conversation->messages->sortByDesc('id')->first()
            : $conversation->messages()->with('sender:id,name')->latest('id')->first();

        $participant = DB::table('chat_participants')
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $userId)
            ->first();

        $unreadCount = $conversation->messages()
            ->where('user_id', '!=', $userId)
            ->when(
                $participant?->last_read_at,
                fn ($query) => $query->where('created_at', '>', $participant->last_read_at)
            )
            ->count();

        $otherParticipants = $conversation->participants
            ->where('id', '!=', $userId)
            ->values();

        $displayTitle = $conversation->title;
        if (! $displayTitle) {
            $displayTitle = $otherParticipants->pluck('name')->filter()->join('، ');
        }

        return [
            'id' => $conversation->id,
            'building_id' => $conversation->building_id,
            'title' => $displayTitle ?: 'محادثة',
            'participants' => $otherParticipants->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
            ])->values(),
            'unread_count' => $unreadCount,
            'last_message' => $lastMessage ? [
                'id' => $lastMessage->id,
                'body' => $lastMessage->body,
                'sender_name' => $lastMessage->sender?->name,
                'created_at' => optional($lastMessage->created_at)->toIso8601String(),
            ] : null,
            'updated_at' => optional($conversation->updated_at)->toIso8601String(),
        ];
    }
}
