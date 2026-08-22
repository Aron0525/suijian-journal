import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const [app, schema, index, indexHtm] = await Promise.all([
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../index.htm', import.meta.url), 'utf8'),
]);

assert.equal(indexHtm, index, 'both PWA entry files must expose the same backup UI');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should be defined`);
  const parameterEnd = source.indexOf(')', start);
  const bodyStart = source.indexOf('{', parameterEnd);
  let depth = 0;
  for (let cursor = bodyStart; cursor < source.length; cursor += 1) {
    if (source[cursor] === '{') depth += 1;
    if (source[cursor] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, cursor + 1);
  }
  assert.fail(`${name} should have a complete function body`);
}

const markerStore = new Map();
const backupContext = vm.createContext({
  CLOUD_DAILY_BACKUP_PREFIX: 'suijian-cloud-daily-backup-v1:',
  CLOUD_DAILY_BACKUP_RETENTION_DAYS: 14,
  Date,
  structuredClone,
  state: { data: { entries: [{ id: 'entry-1', content: 'daily copy' }], summaries: {}, periodSummaries: [], tasks: [] } },
  localStorage: {
    getItem(key) { return markerStore.get(key) ?? null; },
    setItem(key, value) { markerStore.set(key, value); },
  },
});
vm.runInContext([
  extractFunction(app, 'localDateKey'),
  extractFunction(app, 'dailyCloudBackupMarkerKey'),
  extractFunction(app, 'savedDailyCloudBackupDate'),
  extractFunction(app, 'saveDailyCloudBackupDate'),
  extractFunction(app, 'dailyCloudBackupCutoffDate'),
  extractFunction(app, 'cloudDailyBackupPayload'),
].join('\n\n'), backupContext);
assert.equal(backupContext.dailyCloudBackupMarkerKey('user-1'), 'suijian-cloud-daily-backup-v1:user-1');
backupContext.saveDailyCloudBackupDate('user-1', '2026-08-22');
assert.equal(backupContext.savedDailyCloudBackupDate('user-1'), '2026-08-22');
assert.equal(backupContext.dailyCloudBackupCutoffDate(new Date(2026, 7, 22, 12)), '2026-08-09');
const cloudPayload = backupContext.cloudDailyBackupPayload();
assert.equal(cloudPayload.version, 1);
assert.deepEqual(JSON.parse(JSON.stringify(cloudPayload.data)), { entries: [{ id: 'entry-1', content: 'daily copy' }], summaries: {}, periodSummaries: [], tasks: [] });
assert.notEqual(cloudPayload.data, backupContext.state.data, 'cloud backup payload must be a detached snapshot');
assert.match(app, /const CLOUD_DAILY_BACKUP_RETENTION_DAYS = 14/);
assert.match(app, /function dailyCloudBackupMarkerKey\(userId\)/);
assert.match(app, /function dailyCloudBackupCutoffDate\(/);
assert.match(app, /function cloudDailyBackupPayload\(/);
assert.match(app, /async function saveDailyCloudBackup\(userId\)/);
assert.match(app, /journal_backups\?on_conflict=user_id,backup_date/);
assert.match(app, /resolution=ignore-duplicates,return=representation/);
assert.match(app, /journal_backups\?backup_date=lt\./);
assert.match(app, /await saveDailyCloudBackup\(session\.user\.id\)/);
assert.match(app, /云端每日备份/);
assert.match(index, /id="cloud-daily-backup-status"/);
assert.match(schema, /create table if not exists public\.journal_backups/);
assert.match(schema, /unique \(user_id, backup_date\)/);
assert.match(schema, /alter table public\.journal_backups enable row level security/);
assert.match(schema, /revoke update on table public\.journal_backups from authenticated/);
assert.match(schema, /grant select, insert, delete on table public\.journal_backups to authenticated/);
assert.match(schema, /create policy "read own journal backups" on public\.journal_backups/);
assert.match(schema, /create policy "insert own journal backups" on public\.journal_backups/);
assert.match(schema, /create policy "delete own journal backups" on public\.journal_backups/);

console.log('Daily cloud backup regression checks passed');
