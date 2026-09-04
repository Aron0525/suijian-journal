import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [app, schema, migration] = await Promise.all([
  readFile(new URL('app.js', root), 'utf8'),
  readFile(new URL('supabase/schema.sql', root), 'utf8'),
  readFile(new URL('supabase/migrations/20260902000000_add_journal_drafts.sql', root), 'utf8'),
]);

assert.match(schema, /create table if not exists public\.journal_drafts/i, 'cloud drafts need their own account-scoped table');
assert.match(schema, /user_id uuid not null references auth\.users\(id\) on delete cascade/i);
assert.match(schema, /draft_date date not null/i);
assert.match(schema, /payload jsonb not null/i);
assert.match(schema, /deleted_at timestamptz/i);
assert.match(schema, /primary key \(user_id, draft_date\)|unique \(user_id, draft_date\)/i);
assert.match(schema, /alter table public\.journal_drafts enable row level security/i);
assert.match(schema, /create policy "own journal drafts" on public\.journal_drafts/i);
assert.match(migration, /create table if not exists public\.journal_drafts/i, 'the production change must be a CLI-applicable migration');
assert.match(migration, /alter table public\.journal_drafts enable row level security/i);
assert.match(migration, /create policy "own journal drafts" on public\.journal_drafts/i);

assert.match(app, /const CLOUD_DRAFT_SYNC_PREFIX = 'suijian-cloud-draft-sync-v1:'/);
assert.match(app, /function markCloudDraftDirty\(/);
assert.match(app, /function markCloudDraftDeleted\(/);
assert.match(app, /async function pullCloudDrafts\(/);
assert.match(app, /async function pushCloudDrafts\(/);
assert.match(app, /\/rest\/v1\/journal_drafts/);
assert.match(app, /const CLOUD_DRAFT_FALLBACK_TITLE = '⟦岁笺草稿同步⟧'/, 'drafts need a schema-free fallback while the production migration is pending');
assert.match(app, /function isCloudDraftFallbackEntry\(/);
assert.match(app, /async function pushCloudDraftFallbackEntries\(/);
assert.match(app, /\/rest\/v1\/journal_entries\?on_conflict=id/);
assert.match(app, /draftFallbackEntries: cloudDraftFallbackEntries/, 'hidden compatibility rows must be returned to the draft merge instead of the archive');
assert.match(app, /state\.cloud\.draftsStorageMode = 'entries-fallback';/, 'a missing draft table must switch to the compatibility writer');
assert.match(app, /await pullCloudDrafts\([^)]*\);[\s\S]*await pushCloudDrafts\(\);[\s\S]*await pullCloudDrafts\([^)]*\);/, 'sync must verify the draft state after upload');
assert.match(app, /markCloudDraftDirty\(draftDateFromStorageKey\(storageKey\)\)/, 'typing must queue the date-specific draft');
assert.match(app, /markCloudDraftDeleted\(draftDateFromStorageKey\(storageKey\)\)/, 'removing a draft must sync a tombstone');
assert.match(app, /草稿也会同步到同一账号的其他设备/);

console.log('Cloud draft sync regression checks passed');
