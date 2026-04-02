create extension if not exists pgcrypto;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_id uuid not null references public.users(id) on delete cascade,
  booking_id uuid null references public.bookings(id) on delete cascade,
  type text not null check (
    type in (
      'chat_message',
      'booking_requested',
      'booking_confirmed',
      'booking_in_progress',
      'booking_completed',
      'booking_cancelled'
    )
  ),
  title text not null,
  body text not null,
  is_read boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_id_is_read_idx
  on public.notifications (user_id, is_read);

alter table public.notifications enable row level security;

drop policy if exists "notification recipients can read notifications" on public.notifications;
create policy "notification recipients can read notifications"
on public.notifications
for select
using (auth.uid() = user_id);

drop policy if exists "actors can insert notifications" on public.notifications;
create policy "actors can insert notifications"
on public.notifications
for insert
with check (
  auth.uid() = actor_id
  or auth.uid() = user_id
);

drop policy if exists "notification recipients can update notifications" on public.notifications;
create policy "notification recipients can update notifications"
on public.notifications
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
