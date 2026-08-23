import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, schema, index] = await Promise.all([
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
]);

assert.match(app, /const ACCOUNT_AI_CONFIG_PREFIX = 'suijian-ai-config-account-v2:';/);
assert.match(app, /const AI_SETTINGS_TABLE = 'ai_settings';/);
assert.match(app, /function aiConfigStorageKey\(userId/);
assert.match(app, /function readAiConfigDraft\(\)/);
assert.match(app, /function writeAiConfigDraft\(config\)/);
assert.match(app, /async function pullCloudAiSettings\(\)/);
assert.match(app, /async function syncCloudAiSettings\(/);
assert.match(app, /\/rest\/v1\/\$\{AI_SETTINGS_TABLE\}/);
assert.match(app, /runtimeAiApiKey = '';/);
assert.match(index, /id="desktop-app-url"/);
assert.match(index, /id="copy-desktop-app-url"/);

assert.match(schema, /create table if not exists public\.ai_settings/);
assert.match(schema, /alter table public\.ai_settings enable row level security;/);
assert.match(schema, /grant select, insert, update, delete on table public\.ai_settings to authenticated;/);
assert.match(schema, /create policy "own ai settings" on public\.ai_settings/);

console.log('AI account configuration cloud-sync regression checks passed');
