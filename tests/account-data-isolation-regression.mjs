import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const indexHtm = await readFile(new URL('../index.htm', import.meta.url), 'utf8');
const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should be defined`);
  const parameterStart = source.indexOf('(', start);
  let parameterDepth = 0;
  let parameterEnd = -1;
  for (let cursor = parameterStart; cursor < source.length; cursor += 1) {
    if (source[cursor] === '(') parameterDepth += 1;
    if (source[cursor] === ')') parameterDepth -= 1;
    if (parameterDepth === 0) { parameterEnd = cursor; break; }
  }
  const bodyStart = source.indexOf('{', parameterEnd);
  let depth = 0;
  for (let cursor = bodyStart; cursor < source.length; cursor += 1) {
    if (source[cursor] === '{') depth += 1;
    if (source[cursor] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, cursor + 1);
  }
  assert.fail(`${name} should have a closed function body`);
}

assert.equal(indexHtm, index, 'both PWA entry files must expose the same login gate');
assert.match(index, /id="auth-gate"/, 'a signed-out visitor needs a dedicated login gate');
assert.match(index, /id="auth-gate-login"/, 'the gate needs a direct login action');
assert.match(index, /id="journal-workspace"/, 'journal UI must be wrapped so it can be removed from the signed-out surface');
assert.match(app, /const ACCOUNT_DATA_PREFIX = 'suijian-calendar-journal-account-v2:'/);
assert.match(app, /const ACCOUNT_DRAFT_PREFIX = 'suijian-draft-account-v2:'/);
assert.match(app, /const ACCOUNT_CLOUD_ACTIVITY_PREFIX = 'suijian-cloud-activity-v2:'/);
assert.match(app, /const LEGACY_STORAGE_KEY = 'suijian-calendar-journal-v1';/);
assert.match(app, /function journalDataStorageKey\(userId\)/);
assert.match(app, /function accountDraftPrefix\(userId\)/);
assert.match(app, /function hasStoredJournalContent\(data\)/);
assert.match(app, /function migrateLegacyAccountData\(userId\)/);
assert.match(app, /function activateJournalAccount\(userId\)/);
assert.match(app, /function clearJournalAccount\(\)/);
assert.match(app, /function renderJournalAccess\(\)/);
assert.match(app, /state\.data = loadData\(accountId\)/);
assert.match(app, /state\.data = emptyJournalData\(\)/);
assert.match(styles, /\.journal-workspace\[hidden\]\s*\{\s*display:\s*none;/);
assert.match(styles, /\.auth-gate/);

const store = new Map();
const localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); },
};
const context = vm.createContext({
  ACCOUNT_DATA_PREFIX: 'suijian-calendar-journal-account-v2:',
  ACCOUNT_DRAFT_PREFIX: 'suijian-draft-account-v2:',
  ACCOUNT_CLOUD_ACTIVITY_PREFIX: 'suijian-cloud-activity-v2:',
  LEGACY_STORAGE_KEY: 'suijian-calendar-journal-v1',
  localStorage,
  clearTimeout() {},
  state: { data: null, cloud: { session: { user: { id: 'account-a' } }, activity: [], lastError: '', attachmentsSupported: null, tasksSupported: null, backupsSupported: null }, backup: { timer: 0 }, pastedDraft: { content: 'temporary' } },
  draftTimer: 0,
  structuredClone,
  console,
  normalizeAttachments(value) { return Array.isArray(value) ? value : []; },
  normalizeTags(value) { return Array.isArray(value) ? value : []; },
  normalizeMood(value) { return value || ''; },
  normalizeJournalTask(value) { return value; },
  renderSyncStatus() {},
  scheduleAutomaticBackup() {},
  queueCloudSync() {},
  showToast() {},
  render() {},
  renderCloudDialogs() {},
});
vm.runInContext([
  extractFunction(app, 'emptyCloudMeta'),
  extractFunction(app, 'normalizeCloudMeta'),
  extractFunction(app, 'emptyJournalData'),
  extractFunction(app, 'validJournalAccountId'),
  extractFunction(app, 'journalDataStorageKey'),
  extractFunction(app, 'accountDraftPrefix'),
  extractFunction(app, 'accountCloudActivityKey'),
  extractFunction(app, 'loadCloudActivity'),
  extractFunction(app, 'activeJournalAccountId'),
  extractFunction(app, 'normalizeStoredJournalData'),
  extractFunction(app, 'readStoredJournalData'),
  extractFunction(app, 'hasStoredJournalContent'),
  extractFunction(app, 'migrateLegacyAccountData'),
  extractFunction(app, 'loadData'),
  extractFunction(app, 'persistData'),
  extractFunction(app, 'activateJournalAccount'),
  extractFunction(app, 'clearJournalAccount'),
].join('\n\n'), context);

context.state.data = {
  entries: [{ id: 'entry-a', content: 'only account A may read this' }],
  summaries: {}, periodSummaries: [], tasks: [], cloudSync: { accountId: 'account-a', dirty: { entries: [], dailySummaries: [], periodSummaries: [], tasks: [] } },
};
assert.equal(context.persistData({ queue: false }), true, 'an authenticated account can persist its private local cache');
assert.equal(store.has('suijian-calendar-journal-account-v2:account-a'), true);
assert.equal(store.has('suijian-calendar-journal-account-v2:account-b'), false);
assert.equal(JSON.parse(store.get('suijian-calendar-journal-account-v2:account-a')).cloudSync.accountId, 'account-a');

store.set('suijian-calendar-journal-account-v2:legacy-account', JSON.stringify({ entries: [], summaries: {}, periodSummaries: [], tasks: [], cloudSync: { accountId: 'legacy-account', dirty: { entries: [], dailySummaries: [], periodSummaries: [], tasks: [] } } }));
store.set('suijian-calendar-journal-v1', JSON.stringify({
  entries: [{ id: 'legacy-a', content: 'legacy journal bound to account A' }],
  summaries: {}, periodSummaries: [], tasks: [],
  cloudSync: { accountId: 'legacy-account', dirty: { entries: [], dailySummaries: [], periodSummaries: [], tasks: [] } },
}));
assert.equal(context.migrateLegacyAccountData('legacy-account'), true, 'a legacy cache may migrate only into the account it was already bound to');
assert.deepEqual(JSON.parse(JSON.stringify(context.loadData('legacy-account').entries.map((entry) => entry.id))), ['legacy-a']);
assert.equal(context.migrateLegacyAccountData('account-b'), false, 'a legacy cache belonging to another account must not migrate into account B');

context.state.cloud.session = { user: { id: 'account-b' } };
context.activateJournalAccount('account-b');
assert.deepEqual(JSON.parse(JSON.stringify(context.state.data.entries)), [], 'account B must never receive account A local data');
context.state.data.entries.push({ id: 'entry-b', content: 'only account B may read this' });
context.state.data.cloudSync.accountId = 'account-b';
assert.equal(context.persistData({ queue: false }), true);
assert.deepEqual(JSON.parse(store.get('suijian-calendar-journal-account-v2:account-b')).entries.map((entry) => entry.id), ['entry-b']);
assert.deepEqual(JSON.parse(store.get('suijian-calendar-journal-account-v2:account-a')).entries.map((entry) => entry.id), ['entry-a']);

context.state.cloud.session = { user: { id: 'account-a' } };
assert.deepEqual(JSON.parse(JSON.stringify(context.loadData('account-a').entries.map((entry) => entry.id))), ['entry-a'], 'account A cache must be independently readable after account B writes');
context.activateJournalAccount('account-a');
assert.deepEqual(JSON.parse(JSON.stringify(context.state.data.entries.map((entry) => entry.id))), ['entry-a'], 'returning to account A restores only account A cache');
context.state.cloud.session = null;
context.clearJournalAccount();
assert.deepEqual(JSON.parse(JSON.stringify(context.state.data.entries)), [], 'sign-out clears all in-memory journal data');
assert.equal(context.state.pastedDraft, null, 'sign-out clears the active draft surface');

console.log('Account data isolation regression checks passed');
