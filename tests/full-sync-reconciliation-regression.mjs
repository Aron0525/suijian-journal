import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should be defined`);
  const parameters = source.indexOf('(', start);
  let parameterDepth = 0;
  let parameterEnd = -1;
  for (let cursor = parameters; cursor < source.length; cursor += 1) {
    if (source[cursor] === '(') parameterDepth += 1;
    if (source[cursor] === ')') parameterDepth -= 1;
    if (parameterDepth === 0) {
      parameterEnd = cursor;
      break;
    }
  }
  const body = source.indexOf('{', parameterEnd);
  let bodyDepth = 0;
  for (let cursor = body; cursor < source.length; cursor += 1) {
    if (source[cursor] === '{') bodyDepth += 1;
    if (source[cursor] === '}') bodyDepth -= 1;
    if (bodyDepth === 0) return source.slice(start, cursor + 1);
  }
  assert.fail(`${name} should have a closed function body`);
}

assert.match(app, /function reconcileCloudDeltas\(/, 'each sync needs a complete account reconciliation step');
assert.match(app, /function reconcileCloudDraftDeltas\(/, 'saved drafts need reconciliation even when an old client left no dirty marker');
assert.match(app, /const firstCloudPull = await pullCloudData\(\);[\s\S]*reconcileCloudDeltas\(firstCloudPull\);/, 'manual and scheduled sync must reconcile local records after the first server pull');
assert.match(app, /reconcileCloudDraftDeltas\(firstCloudDraftRecords\);/, 'manual and scheduled sync must reconcile local drafts after the first server pull');
assert.match(app, /const finalCloudPull = await pullCloudData\(\);[\s\S]*await pullCloudDrafts\(finalCloudPull\.draftFallbackEntries\);/, 'sync must fetch the final server state after incremental upload');

const context = vm.createContext({ Date });
vm.runInContext([
  extractFunction(app, 'cloudUpdatedAt'),
  extractFunction(app, 'shouldQueueCloudRecord'),
].join('\n\n'), context);

const local = { updatedAt: '2026-09-04T10:00:00.000Z' };
assert.equal(context.shouldQueueCloudRecord(local, null), true, 'a locally stored record absent from the server must be uploaded');
assert.equal(context.shouldQueueCloudRecord(local, { updated_at: '2026-09-04T09:00:00.000Z' }), true, 'a newer local record must be uploaded');
assert.equal(context.shouldQueueCloudRecord(local, { updated_at: '2026-09-04T10:00:00.000Z' }), false, 'an equal record is not an incremental upload');
assert.equal(context.shouldQueueCloudRecord(local, { updated_at: '2026-09-04T11:00:00.000Z' }), false, 'a newer server record must not be overwritten');

const entryId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const summaryDate = '2026-09-04';
const reconciliationContext = vm.createContext({
  Date,
  state: {
    data: {
      entries: [{ id: entryId, updatedAt: '2026-09-04T10:00:00.000Z', createdAt: '2026-09-04T09:00:00.000Z' }],
      summaries: { [summaryDate]: { content: '当天汇总', updatedAt: '2026-09-04T10:00:00.000Z', createdAt: '2026-09-04T09:00:00.000Z' } },
      periodSummaries: [],
      tasks: [],
      cloudSync: { dirty: { entries: [], dailySummaries: [], periodSummaries: [], tasks: [] } },
    },
  },
});
vm.runInContext([
  'function summaryForDate(date) { return state.data.summaries[date]; }',
  'function markCloudDirty(kind, id) { const values = state.data.cloudSync.dirty[kind]; if (!values.includes(id)) values.push(id); }',
  extractFunction(app, 'cloudUpdatedAt'),
  extractFunction(app, 'ensureCloudMetadata'),
  extractFunction(app, 'shouldQueueCloudRecord'),
  extractFunction(app, 'reconcileCloudDeltas'),
].join('\n\n'), reconciliationContext);

const missingRemote = reconciliationContext.reconcileCloudDeltas({ entries: [], dailySummaries: [], periodSummaries: [], tasks: [] });
assert.equal(missingRemote.entries, 1, 'a same-account cache with no old dirty marker must still queue its unsynced entry');
assert.equal(missingRemote.dailySummaries, 1, 'the same reconciliation must include summaries');
assert.deepEqual([...reconciliationContext.state.data.cloudSync.dirty.entries], [entryId]);
assert.deepEqual([...reconciliationContext.state.data.cloudSync.dirty.dailySummaries], [summaryDate]);

reconciliationContext.state.data.cloudSync.dirty = { entries: [], dailySummaries: [], periodSummaries: [], tasks: [] };
const equalRemote = reconciliationContext.reconcileCloudDeltas({
  entries: [{ id: entryId, updated_at: '2026-09-04T10:00:00.000Z' }],
  dailySummaries: [{ entry_date: summaryDate, updated_at: '2026-09-04T10:00:00.000Z' }],
  periodSummaries: [],
  tasks: [],
});
assert.equal(equalRemote.entries + equalRemote.dailySummaries, 0, 'the all-content check must only upload incremental records');

console.log('Full account sync reconciliation regression checks passed');
