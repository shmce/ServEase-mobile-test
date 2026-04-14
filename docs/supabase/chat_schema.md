# Chat Schema Contract

This repository now prefers a standard Supabase chat model:

- `public.conversations`
- `public.messages`

The SQL contract lives in:

- [`supabase/chat_schema.sql`](C:/Users/Personal/Desktop/ServEase/tite/ServEase-mobile-test/supabase/chat_schema.sql)

## Why This Exists

The mobile app currently ships with graceful fallback behavior so chat can still work while the backend is incomplete. However, the intended production contract is:

- one conversation per booking
- customer and provider linked directly on the conversation
- messages stored under `conversation_id`
- `booking_id` duplicated on messages for easier tracing and support tooling
- `last_message_text` and `last_message_at` stored on the conversation for inbox performance
- per-role read markers stored on the conversation for unread badges

## Expected Tables

### `conversations`

Required columns:

- `id`
- `booking_id`
- `customer_id`
- `provider_id`
- `service_id`
- `last_message_text`
- `last_message_at`
- `customer_last_read_at`
- `provider_last_read_at`
- `created_at`
- `updated_at`

### `messages`

Required columns:

- `id`
- `conversation_id`
- `booking_id`
- `sender_id`
- `sender_role`
- `body`
- `delivery_status`
- `created_at`

## Current App Behavior

[`chatService.ts`](C:/Users/Personal/Desktop/ServEase/tite/ServEase-mobile-test/services/chatService.ts) now prefers this schema first.

Unread state is tracked from:

- `customer_last_read_at`
- `provider_last_read_at`

Inbox badges should be computed as messages from the other party created after the current role's read marker.

Message delivery state should be tracked from `delivery_status`:

- `sent`: accepted locally but not yet confirmed by the backend
- `delivered`: persisted successfully
- `failed`: local fallback retained because persistence failed

If these tables are not available yet, the app falls back to:

- booking-backed conversation summaries
- local in-memory seeded thread data
- best-effort message persistence attempts

That fallback is meant only to keep mobile development moving. The SQL schema above is the target contract for production.
