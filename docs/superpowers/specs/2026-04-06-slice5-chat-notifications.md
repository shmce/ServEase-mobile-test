# Slice 5 — Chat and Notifications API Migration

**Date:** 2026-04-06  
**Status:** Approved  
**Risk:** High — chat is a core UX flow; behavior parity must be maintained

---

## Goal

Replace all direct Supabase reads/writes in `chatService.ts` and `notificationService.ts` with backend REST endpoints. Realtime channel subscriptions are replaced with polling at bounded intervals. SSE/websocket delivery is out of scope for this slice.

---

## Scope

**Backend — new module:**
- `backend/src/modules/chat/` — conversation list, thread fetch, send message, mark read

**Backend — new endpoints in existing notifications module:**
- `GET /notifications` — list for current user
- `PATCH /notifications/:id/read` — mark one read
- `PATCH /notifications/read-all` — mark all read
- `GET /notifications/unread-count` — count of unread

**Mobile:**
- `mobile/services/chatService.ts` — replace all `bookingDb` queries and `supabase.channel()` with API calls + polling
- `mobile/services/notificationService.ts` — replace all `notificationDb` queries and `supabase.channel()` with API calls + polling

---

## Non-goals

- No SSE or websocket delivery
- No push notification infrastructure
- No changes to chat UI screens beyond what the service contract change requires
- No changes to how notifications are *created* (booking status events still create them server-side)

---

## Current Mobile Functions to Migrate

### chatService.ts
| Function | Current | After |
|---|---|---|
| `getChatSummaries(userId, role)` | `bookingDb.from('conversations')` join | `GET /chat/conversations?role=customer|provider` |
| `getChatThread(bookingId, role)` | `bookingDb.from('messages')` + `bookingDb.from('conversations')` | `GET /chat/conversations/:bookingId/messages` |
| `sendChatMessage(bookingId, role, text, ...)` | `bookingDb.from('messages').insert` | `POST /chat/conversations/:bookingId/messages` |
| `markThreadRead(bookingId, role)` | `bookingDb.from('conversations').update` | `PATCH /chat/conversations/:bookingId/read` |
| `subscribeToThread(bookingId, callback)` | `supabase.channel(...)` | Polling via `setInterval` (5s) |
| `subscribeToInbox(userId, role, callback)` | `supabase.channel(...)` | Polling via `setInterval` (10s) |

### notificationService.ts
| Function | Current | After |
|---|---|---|
| `getNotifications(userId)` | `notificationDb.from('notifications')` | `GET /notifications` |
| `markNotificationRead(userId, id)` | `notificationDb.from('notifications').update` | `PATCH /notifications/:id/read` |
| `markAllNotificationsRead(userId)` | `notificationDb.from('notifications').update` | `PATCH /notifications/read-all` |
| `getUnreadNotificationCount(userId)` | derives from `getNotifications` | `GET /notifications/unread-count` |
| `createChatNotification(...)` | `notificationDb.from('notifications').insert` | `POST /notifications` (internal — backend creates on message send) |
| `createBookingStatusNotification(...)` | `notificationDb.from('notifications').insert` | Remove from mobile — backend creates on booking status change |
| `subscribeToNotifications(userId, callback)` | `supabase.channel(...)` | Polling via `setInterval` (10s) |

---

## Backend — Chat Module

### Module: `backend/src/modules/chat/`

Files to create:
- `chat.module.ts`
- `chat.controller.ts`
- `chat.service.ts`
- `dto/send-message.dto.ts`

### Endpoints

```
GET    /chat/conversations                          — list conversations for current user
GET    /chat/conversations/:bookingId/messages      — fetch thread (messages + conversation meta)
POST   /chat/conversations/:bookingId/messages      — send a message
PATCH  /chat/conversations/:bookingId/read          — mark thread read for current user's role
```

All endpoints require auth (SupabaseAuthGuard).

### `GET /chat/conversations`

Joins `booking_svc.conversations` → `booking_svc.bookings` → `identity_svc.users` (other party) → latest message.

**Response shape** (maps to `ChatSummary[]`):
```json
[
  {
    "id": "uuid",
    "bookingId": "uuid",
    "otherPartyName": "string",
    "otherPartyPhone": "string",
    "serviceName": "string",
    "lastMessage": "string",
    "lastMessageTime": "ISO string",
    "unreadCount": 0
  }
]
```

Unread count: messages where `sender_role != callerRole` and `created_at > last_read_at` for the caller's role column on the conversation row.

### `GET /chat/conversations/:bookingId/messages`

Returns conversation metadata + messages array, ordered `created_at ASC`.

**Response shape** (maps to `ChatThread`):
```json
{
  "id": "uuid",
  "bookingId": "uuid",
  "otherPartyName": "string",
  "otherPartyPhone": "string",
  "serviceName": "string",
  "messages": [
    {
      "id": "uuid",
      "text": "string",
      "createdAt": "ISO string",
      "sender": "customer|provider",
      "deliveryStatus": "sent|delivered|failed"
    }
  ]
}
```

If no conversation row exists yet, return empty `messages` array with conversation meta derived from the booking.

### `POST /chat/conversations/:bookingId/messages`

**Body DTO:**
```ts
class SendMessageDto {
  @IsString() @MinLength(1) text: string;
}
```

- Upserts the conversation row if it doesn't exist yet
- Inserts the message with `sender_role` derived from the authenticated user's `db_role`
- Creates a `chat_message` notification for the other party (backend-side, replaces mobile `createChatNotification`)
- Returns the created message

### `PATCH /chat/conversations/:bookingId/read`

Updates `customer_last_read_at` or `provider_last_read_at` on the conversation row to `now()` based on the caller's role.

---

## Backend — Notifications Endpoints

Add to existing `backend/src/modules/notifications/` (create module if not exists).

```
GET    /notifications                — list for authenticated user, ordered created_at DESC
PATCH  /notifications/:id/read       — set is_read=true for one notification owned by user
PATCH  /notifications/read-all       — set is_read=true for all unread notifications for user
GET    /notifications/unread-count   — return { count: number }
POST   /notifications                — internal: create a notification (used by chat and booking modules, not exposed to mobile directly)
```

All endpoints require auth.

---

## Mobile — Polling Strategy

Replace `supabase.channel()` subscriptions with polling helpers:

```ts
// Polling interval constants
const CHAT_THREAD_POLL_MS = 5000;   // 5s while thread is open
const CHAT_INBOX_POLL_MS = 10000;   // 10s for inbox
const NOTIFICATION_POLL_MS = 10000; // 10s for notifications
```

`subscribeToThread` and `subscribeToInbox` return an unsubscribe function (same interface as today):
```ts
// Current interface preserved:
type ChatSubscription = () => void;

function subscribeToThread(bookingId, callback): ChatSubscription {
  const interval = setInterval(() => callback(), CHAT_THREAD_POLL_MS);
  return () => clearInterval(interval);
}
```

This preserves the call sites in chat screens without changes.

---

## Mobile — createChatNotification / createBookingStatusNotification

These are currently called from mobile to insert directly into `notificationDb`. After migration:

- `createChatNotification` — **remove** from mobile. The backend's `POST /chat/conversations/:bookingId/messages` creates the notification server-side.
- `createBookingStatusNotification` — **remove** from mobile. The backend booking status transition endpoints already own this responsibility (or will after a booking events cleanup pass).

Both functions can be stubbed to no-ops during transition if call sites can't all be cleaned at once, then deleted in the cleanup pass.

---

## Files Affected

| File | Change |
|---|---|
| `backend/src/modules/chat/` | New module — 4 files |
| `backend/src/modules/notifications/` | Add 4 endpoints or create module |
| `backend/src/app.module.ts` | Register ChatModule, NotificationsModule |
| `mobile/services/chatService.ts` | Replace all `bookingDb` + `supabase.channel()` with API + polling |
| `mobile/services/notificationService.ts` | Replace all `notificationDb` + `supabase.channel()` with API + polling |

---

## Risks

- **Unread count accuracy:** Polling at 5–10s means brief windows of stale counts. Acceptable for v1; SSE can improve this later.
- **Conversation creation race:** Two parties opening chat simultaneously may both trigger conversation upsert — backend must use `ON CONFLICT DO NOTHING` or equivalent idempotent upsert keyed on `booking_id`.
- **Notification creation:** Removing `createChatNotification` from mobile means the backend `POST /chat/messages` must reliably create notifications. Verify this in the backend implementation before removing the mobile call.
- **Memory fallback:** Both services currently have in-memory fallbacks. These can be retained during transition but should be removed in the cleanup pass.

---

## Acceptance Criteria

1. Customer and provider can send and receive chat messages through the API
2. Inbox loads all conversations via `GET /chat/conversations`
3. Thread loads messages via `GET /chat/conversations/:bookingId/messages`
4. Sending a message creates a notification for the other party
5. Notifications list, mark-read, and unread count work via API
6. Polling-based subscriptions fire callbacks at the configured intervals
7. No `bookingDb` or `notificationDb` or `supabase.channel()` calls remain in chatService or notificationService
8. All chat screen behavior is preserved (messages appear, unread badges update)

---

## Verification

1. Send message as customer → appears in provider thread within one poll cycle
2. Provider inbox unread count increments after message received
3. Mark thread read → unread count drops to 0
4. Notification appears after booking status change
5. `rg "bookingDb|notificationDb|supabase\.channel" mobile/services/chatService.ts mobile/services/notificationService.ts` returns no hits
