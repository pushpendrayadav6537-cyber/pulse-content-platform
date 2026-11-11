-- Pulse platform schema (run in Supabase SQL Editor)
create extension if not exists pgcrypto;

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 40),
  session_token_hash text unique not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create table if not exists public.content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  category text default 'General',
  storage_path text not null,
  mime_type text,
  created_by uuid,
  created_at timestamptz not null default now(),
  published boolean not null default true
);
create table if not exists public.watch_events (
  id bigint generated always as identity primary key,
  guest_id uuid references public.guests(id) on delete cascade,
  content_id uuid references public.content(id) on delete cascade,
  event_type text not null check(event_type in ('start','progress','pause','finish')),
  position_seconds numeric default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  guest_id uuid references public.guests(id) on delete cascade,
  sender_role text not null check(sender_role in ('guest','admin')),
  message text not null check(char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);
create table if not exists public.live_presence (
  guest_id uuid primary key references public.guests(id) on delete cascade,
  content_id uuid references public.content(id) on delete set null,
  status text not null default 'online',
  updated_at timestamptz not null default now()
);

alter table public.guests enable row level security;
alter table public.content enable row level security;
alter table public.watch_events enable row level security;
alter table public.chat_messages enable row level security;
alter table public.live_presence enable row level security;

-- Public guest library: only published content metadata is readable.
create policy "published content readable" on public.content
for select to anon, authenticated using (published=true);

-- IMPORTANT: Do NOT allow anon inserts into guests/watch_events/chat/presence.
-- Guest write APIs must be mediated by a trusted Edge Function that validates
-- a signed guest-session token. Admin writes should use authenticated admin
-- identity and server-side role checks. Never put service_role/secret keys in JS.

alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.live_presence;
