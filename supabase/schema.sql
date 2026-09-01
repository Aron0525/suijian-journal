create extension if not exists pgcrypto;

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  title text not null default '',
  content text not null,
  original_content text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.journal_entries
  add column if not exists attachments jsonb not null default '[]'::jsonb;

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

-- Journal entry metadata remains inside `attachments` as { files, tags, mood } so older
-- deployed clients keep synchronizing while the product gains tags and a mood field.
create table if not exists public.journal_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  source_key text not null,
  content text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, source_key)
);

create index if not exists journal_tasks_user_updated_idx
  on public.journal_tasks (user_id, updated_at desc)
  where deleted_at is null;

drop trigger if exists journal_tasks_touch_updated_at on public.journal_tasks;
drop trigger if exists journal_tasks_reject_stale_update on public.journal_tasks;
create trigger journal_tasks_reject_stale_update before update on public.journal_tasks
for each row execute function public.reject_stale_update();
create trigger journal_tasks_touch_updated_at before update on public.journal_tasks
for each row execute function public.touch_updated_at();

alter table public.journal_tasks enable row level security;
grant select, insert, update, delete on table public.journal_tasks to authenticated;
drop policy if exists "own journal tasks" on public.journal_tasks;
create policy "own journal tasks" on public.journal_tasks
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Unsaved editor content must remain separate from completed journal entries.
-- A single row per user/date keeps the draft available across the user's
-- signed-in devices without making it appear in the journal archive.
create table if not exists public.journal_drafts (
  user_id uuid not null references auth.users(id) on delete cascade,
  draft_date date not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, draft_date),
  check (jsonb_typeof(payload) = 'object')
);

create index if not exists journal_drafts_user_updated_idx
  on public.journal_drafts (user_id, updated_at desc);

drop trigger if exists journal_drafts_touch_updated_at on public.journal_drafts;
drop trigger if exists journal_drafts_reject_stale_update on public.journal_drafts;
create trigger journal_drafts_reject_stale_update before update on public.journal_drafts
for each row execute function public.reject_stale_update();
create trigger journal_drafts_touch_updated_at before update on public.journal_drafts
for each row execute function public.touch_updated_at();

alter table public.journal_drafts enable row level security;
grant select, insert, update, delete on table public.journal_drafts to authenticated;
drop policy if exists "own journal drafts" on public.journal_drafts;
create policy "own journal drafts" on public.journal_drafts
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- One immutable user-visible recovery snapshot is kept for each active day.
-- The client creates it after that day's first completed sync and prunes rows
-- older than 14 days. This remains separate from the live journal tables, so
-- an accidental delete or a later edit does not alter an earlier daily copy.
create table if not exists public.journal_backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  backup_date date not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, backup_date)
);

create index if not exists journal_backups_user_date_idx
  on public.journal_backups (user_id, backup_date desc);

alter table public.journal_backups enable row level security;
revoke update on table public.journal_backups from authenticated;
grant select, insert, delete on table public.journal_backups to authenticated;
drop policy if exists "read own journal backups" on public.journal_backups;
drop policy if exists "insert own journal backups" on public.journal_backups;
drop policy if exists "delete own journal backups" on public.journal_backups;
create policy "read own journal backups" on public.journal_backups
for select to authenticated
using (auth.uid() = user_id);
create policy "insert own journal backups" on public.journal_backups
for insert to authenticated
with check (auth.uid() = user_id);
create policy "delete own journal backups" on public.journal_backups
for delete to authenticated
using (auth.uid() = user_id);

-- API configuration is stored per authenticated account so the same model and
-- prompts can follow the user between the web and Android clients. The config
-- includes the user-supplied provider key; RLS permits that row only to its owner.
create table if not exists public.ai_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(config) = 'object')
);

drop trigger if exists ai_settings_touch_updated_at on public.ai_settings;
drop trigger if exists ai_settings_reject_stale_update on public.ai_settings;
create trigger ai_settings_reject_stale_update before update on public.ai_settings
for each row execute function public.reject_stale_update();
create trigger ai_settings_touch_updated_at before update on public.ai_settings
for each row execute function public.touch_updated_at();

alter table public.ai_settings enable row level security;
grant select, insert, update, delete on table public.ai_settings to authenticated;
drop policy if exists "own ai settings" on public.ai_settings;
create policy "own ai settings" on public.ai_settings
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'journal-attachments',
  'journal-attachments',
  false,
  1048576,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
    'text/plain', 'text/markdown', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update
set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "own journal attachments select" on storage.objects;
create policy "own journal attachments select" on storage.objects
for select to authenticated
using (bucket_id = 'journal-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own journal attachments insert" on storage.objects;
create policy "own journal attachments insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'journal-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own journal attachments update" on storage.objects;
create policy "own journal attachments update" on storage.objects
for update to authenticated
using (bucket_id = 'journal-attachments' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'journal-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own journal attachments delete" on storage.objects;
create policy "own journal attachments delete" on storage.objects
for delete to authenticated
using (bucket_id = 'journal-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

-- Administrator access is deliberately server-side only. Browser clients never
-- receive the service-role key or a policy that reads another user's diary.
create table if not exists public.journal_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(detail) = 'object')
);

create index if not exists admin_audit_events_actor_created_idx
  on public.admin_audit_events (actor_user_id, created_at desc);
create index if not exists admin_audit_events_target_created_idx
  on public.admin_audit_events (target_user_id, created_at desc);

alter table public.journal_admins enable row level security;
alter table public.admin_audit_events enable row level security;
revoke all on table public.journal_admins, public.admin_audit_events from anon, authenticated;

-- Initial allow-list. If the account has not yet been created, this statement
-- safely inserts no row; re-run this schema after the account exists.
insert into public.journal_admins (user_id)
select id from auth.users where lower(email) = 'rili66@outlook.com'
on conflict (user_id) do nothing;
