begin;

-- Some early production environments were created before cloud drafts were
-- introduced. Keep this admin migration self-contained so it can be applied
-- safely even when that earlier migration was skipped.
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

grant select on table
  public.journal_entries,
  public.journal_drafts,
  public.daily_summaries,
  public.period_summaries,
  public.journal_tasks,
  public.journal_backups,
  public.ai_settings
to service_role;

grant select on table storage.objects to service_role;

notify pgrst, 'reload schema';

commit;
