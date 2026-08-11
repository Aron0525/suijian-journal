create extension if not exists pgcrypto;

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  title text not null default '',
  content text not null,
  original_content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  content text not null,
  model text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, entry_date)
);

create table if not exists public.period_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  entry_ids uuid[] not null default '{}',
  content text not null,
  model text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (start_date <= end_date)
);

create index if not exists journal_entries_user_date_idx
  on public.journal_entries (user_id, entry_date desc, updated_at desc)
  where deleted_at is null;
create index if not exists daily_summaries_user_date_idx
  on public.daily_summaries (user_id, entry_date desc)
  where deleted_at is null;
create index if not exists period_summaries_user_date_idx
  on public.period_summaries (user_id, start_date desc, end_date desc)
  where deleted_at is null;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Reject a stale client upsert before touch_updated_at replaces its timestamp.
-- This makes an offline device fail safely instead of silently overwriting a
-- newer version saved by another device.
create or replace function public.reject_stale_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.updated_at < old.updated_at then
    raise exception 'stale update: refresh and resolve the conflict before saving';
  end if;
  return new;
end;
$$;

drop trigger if exists journal_entries_touch_updated_at on public.journal_entries;
drop trigger if exists journal_entries_reject_stale_update on public.journal_entries;
create trigger journal_entries_reject_stale_update before update on public.journal_entries
for each row execute function public.reject_stale_update();
create trigger journal_entries_touch_updated_at before update on public.journal_entries
for each row execute function public.touch_updated_at();

drop trigger if exists daily_summaries_touch_updated_at on public.daily_summaries;
drop trigger if exists daily_summaries_reject_stale_update on public.daily_summaries;
create trigger daily_summaries_reject_stale_update before update on public.daily_summaries
for each row execute function public.reject_stale_update();
create trigger daily_summaries_touch_updated_at before update on public.daily_summaries
for each row execute function public.touch_updated_at();

drop trigger if exists period_summaries_touch_updated_at on public.period_summaries;
drop trigger if exists period_summaries_reject_stale_update on public.period_summaries;
create trigger period_summaries_reject_stale_update before update on public.period_summaries
for each row execute function public.reject_stale_update();
create trigger period_summaries_touch_updated_at before update on public.period_summaries
for each row execute function public.touch_updated_at();

alter table public.journal_entries enable row level security;
alter table public.daily_summaries enable row level security;
alter table public.period_summaries enable row level security;

-- RLS decides which rows each signed-in user may access; these grants allow
-- the authenticated PostgREST role to reach the tables in the first place.
grant select, insert, update, delete on table public.journal_entries, public.daily_summaries, public.period_summaries to authenticated;

drop policy if exists "own journal entries" on public.journal_entries;
create policy "own journal entries" on public.journal_entries
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "own daily summaries" on public.daily_summaries;
create policy "own daily summaries" on public.daily_summaries
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "own period summaries" on public.period_summaries;
create policy "own period summaries" on public.period_summaries
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
