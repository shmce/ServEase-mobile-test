create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid not null references public.users(id) on delete cascade,
  service_id uuid null references public.provider_services(id) on delete set null,
  last_message_text text null,
  last_message_at timestamptz null,
  customer_last_read_at timestamptz null,
  provider_last_read_at timestamptz null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.conversations add column if not exists customer_last_read_at timestamptz null;
alter table public.conversations add column if not exists provider_last_read_at timestamptz null;

create index if not exists conversations_customer_id_idx on public.conversations (customer_id);
create index if not exists conversations_provider_id_idx on public.conversations (provider_id);
create index if not exists conversations_last_message_at_idx on public.conversations (last_message_at desc nulls last);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer', 'provider', 'admin')),
  body text not null,
  delivery_status text not null default 'delivered' check (delivery_status in ('sent', 'delivered', 'failed')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.messages add column if not exists delivery_status text not null default 'delivered';

create index if not exists messages_conversation_id_idx on public.messages (conversation_id, created_at asc);
create index if not exists messages_booking_id_idx on public.messages (booking_id, created_at asc);
create index if not exists messages_sender_id_idx on public.messages (sender_id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "conversation participants can read conversations" on public.conversations;
create policy "conversation participants can read conversations"
on public.conversations
for select
using (
  auth.uid() = customer_id
  or auth.uid() = provider_id
);

drop policy if exists "conversation participants can insert conversations" on public.conversations;
create policy "conversation participants can insert conversations"
on public.conversations
for insert
with check (
  auth.uid() = customer_id
  or auth.uid() = provider_id
);

drop policy if exists "conversation participants can update conversations" on public.conversations;
create policy "conversation participants can update conversations"
on public.conversations
for update
using (
  auth.uid() = customer_id
  or auth.uid() = provider_id
)
with check (
  auth.uid() = customer_id
  or auth.uid() = provider_id
);

drop policy if exists "conversation participants can read messages" on public.messages;
create policy "conversation participants can read messages"
on public.messages
for select
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (auth.uid() = c.customer_id or auth.uid() = c.provider_id)
  )
);

drop policy if exists "conversation participants can insert messages" on public.messages;
create policy "conversation participants can insert messages"
on public.messages
for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (auth.uid() = c.customer_id or auth.uid() = c.provider_id)
  )
);
