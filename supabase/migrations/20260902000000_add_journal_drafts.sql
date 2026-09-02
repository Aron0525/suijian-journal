-- Cross-device editor drafts. Kept separate from saved journal entries so a
-- draft never appears in the archive until the user explicitly saves it.
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
