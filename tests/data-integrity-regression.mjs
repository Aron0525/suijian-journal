import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should be defined`);
  const parameterStart = source.indexOf('(', start);
  let parameterDepth = 0;
  let parameterEnd = -1;
  for (let cursor = parameterStart; cursor < source.length; cursor += 1) {
    if (source[cursor] === '(') parameterDepth += 1;
    if (source[cursor] === ')') parameterDepth -= 1;
    if (parameterDepth === 0) {
      parameterEnd = cursor;
      break;
    }
  }
  assert.notEqual(parameterEnd, -1, `${name} should have a closed parameter list`);
  const bodyStart = source.indexOf('{', parameterEnd);
  let depth = 0;
  for (let cursor = bodyStart; cursor < source.length; cursor += 1) {
    if (source[cursor] === '{') depth += 1;
    if (source[cursor] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, cursor + 1);
  }
  assert.fail(`${name} should have a closed function body`);
}

const conflictId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const entryId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const baseContext = {
  MAX_ENTRY_TITLE_CHARS: 80,
  crypto: { randomUUID: () => conflictId },
  Date,
};

const policyContext = vm.createContext({ ...baseContext });
vm.runInContext([
  extractFunction(app, 'cloudUpdatedAt'),
  extractFunction(app, 'incomingWins'),
  extractFunction(app, 'conflictCopyTitle'),
  extractFunction(app, 'createEntryConflictCopy'),
  extractFunction(app, 'shouldPreserveDirtyEntry'),
  extractFunction(app, 'shouldMergeImportedEntry'),
  extractFunction(app, 'shouldRestoreImportedEntry'),
  extractFunction(app, 'resolveImportedEntries'),
  extractFunction(app, 'tombstoneLinkedTasks'),
].join('\n\n'), policyContext);

const localEntry = {
  id: entryId,
  date: '2026-08-21',
  title: '本机修改',
  content: '保留这段本机内容',
  createdAt: '2026-08-21T08:00:00.000Z',
  updatedAt: '2026-08-21T10:00:00.000Z',
};
const newerRemoteEntry = {
  ...localEntry,
  title: '远端修改',
  content: '远端较新内容',
  updatedAt: '2026-08-21T11:00:00.000Z',
};

assert.equal(policyContext.shouldPreserveDirtyEntry(localEntry, newerRemoteEntry, [entryId]), true, 'a newer remote version must preserve a dirty local entry');
assert.equal(policyContext.shouldPreserveDirtyEntry(localEntry, newerRemoteEntry, []), false, 'a clean local entry should not create a conflict copy');
assert.equal(policyContext.shouldPreserveDirtyEntry({ ...localEntry, deletedAt: '2026-08-21T10:30:00.000Z' }, newerRemoteEntry, [entryId]), false, 'a tombstone should not be resurrected as a conflict copy');

const conflictCopy = policyContext.createEntryConflictCopy(localEntry, '2026-08-21T12:00:00.000Z');
assert.equal(conflictCopy.id, conflictId);
assert.match(conflictCopy.title, /^同步冲突副本 · 本机修改/);
assert.equal(conflictCopy.content, localEntry.content);
assert.equal(conflictCopy.createdAt, '2026-08-21T12:00:00.000Z');
assert.equal(conflictCopy.updatedAt, '2026-08-21T12:00:00.000Z');
assert.equal(conflictCopy.deletedAt, undefined);

assert.equal(
  policyContext.shouldRestoreImportedEntry(
    { ...localEntry, deletedAt: '2026-08-21T10:00:00.000Z' },
    newerRemoteEntry,
  ),
  true,
  'a newer live export should restore a locally tombstoned entry with the same id',
);
assert.equal(policyContext.shouldMergeImportedEntry(localEntry, newerRemoteEntry), true, 'a newer live import should replace a same-id live record');
assert.equal(policyContext.shouldMergeImportedEntry(newerRemoteEntry, localEntry), false, 'an older live import must not replace local content');
assert.equal(policyContext.shouldMergeImportedEntry(localEntry, { ...newerRemoteEntry, updatedAt: localEntry.updatedAt }), false, 'an equal-timestamp import must not replace local content');
assert.equal(policyContext.shouldMergeImportedEntry(localEntry, { ...newerRemoteEntry, deletedAt: newerRemoteEntry.updatedAt }), false, 'a tombstone import must not replace a live entry');
const importedNewEntry = {
  ...localEntry,
  id: '99999999-9999-4999-8999-999999999999',
  title: '新增导入记录',
  updatedAt: '2026-08-21T13:00:00.000Z',
};
const importResolution = policyContext.resolveImportedEntries(
  [
    localEntry,
    { ...localEntry, id: '88888888-8888-4888-8888-888888888888', updatedAt: '2026-08-21T12:00:00.000Z' },
    { ...localEntry, id: '77777777-7777-4777-8777-777777777777', deletedAt: '2026-08-21T10:00:00.000Z' },
  ],
  [
    newerRemoteEntry,
    { ...localEntry, id: '88888888-8888-4888-8888-888888888888', title: '较旧导入', updatedAt: '2026-08-21T11:00:00.000Z' },
    { ...newerRemoteEntry, id: '77777777-7777-4777-8777-777777777777' },
    importedNewEntry,
    importedNewEntry,
  ],
);
assert.deepEqual([...importResolution.newEntries.map((entry) => entry.id)], [importedNewEntry.id], 'a new imported entry should be queued exactly once');
assert.deepEqual([...importResolution.mergedEntries.map((entry) => entry.id)], [entryId, '77777777-7777-4777-8777-777777777777'], 'only newer same-id live records should merge');
assert.equal(importResolution.restoredEntryCount, 1, 'a newer live record should restore one local tombstone');
assert.equal(
  policyContext.shouldRestoreImportedEntry(
    { ...localEntry, updatedAt: '2026-08-21T12:00:00.000Z', deletedAt: '2026-08-21T12:00:00.000Z' },
    newerRemoteEntry,
  ),
  false,
  'an older export must not undo a newer local deletion',
);
assert.equal(
  policyContext.shouldRestoreImportedEntry(
    { ...localEntry, deletedAt: '2026-08-21T10:00:00.000Z' },
    { ...newerRemoteEntry, deletedAt: '2026-08-21T11:00:00.000Z' },
  ),
  false,
  'an imported tombstone must not restore a deleted entry',
);

const taskId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const otherEntryId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const linkedTasks = [
  { id: taskId, entryId, text: '关联待办', updatedAt: '2026-08-21T09:00:00.000Z' },
  { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', entryId: otherEntryId, text: '其他待办', updatedAt: '2026-08-21T09:00:00.000Z' },
  { id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', entryId, text: '已删除待办', updatedAt: '2026-08-21T09:00:00.000Z', deletedAt: '2026-08-21T09:30:00.000Z' },
];
const tombstonedTasks = policyContext.tombstoneLinkedTasks(linkedTasks, entryId, '2026-08-21T12:00:00.000Z');
assert.equal(tombstonedTasks[0].deletedAt, '2026-08-21T12:00:00.000Z');
assert.equal(tombstonedTasks[0].updatedAt, '2026-08-21T12:00:00.000Z');
assert.equal(tombstonedTasks[1], linkedTasks[1], 'deleting an entry must not alter unrelated tasks');
assert.equal(tombstonedTasks[2], linkedTasks[2], 'an existing task tombstone must be retained');

const taskReconcileContext = vm.createContext({
  crypto: {
    sequence: 0,
    randomUUID() {
      this.sequence += 1;
      return this.sequence === 1
        ? '11111111-1111-4111-8111-111111111111'
        : '22222222-2222-4222-8222-222222222222';
    },
  },
  Date,
});
vm.runInContext([
  extractFunction(app, 'extractJournalTasks'),
  extractFunction(app, 'taskSourceSlot'),
  extractFunction(app, 'taskCreatedAt'),
  extractFunction(app, 'tombstoneLinkedTasks'),
  extractFunction(app, 'reconcileJournalTasks'),
].join('\n\n'), taskReconcileContext);
const legacyTask = {
  id: taskId,
  entryId,
  sourceKey: `${entryId}:0:0:旧任务`,
  text: '旧任务',
  completed: false,
  createdAt: '2026-08-21T09:00:00.000Z',
  updatedAt: '2026-08-21T09:00:00.000Z',
};
const taskEntry = { id: entryId, title: '', content: '待办：新任务' };
const textChanged = taskReconcileContext.reconcileJournalTasks([legacyTask], [taskEntry], '2026-08-21T10:00:00.000Z');
assert.equal(textChanged.tasks.length, 1, 'changing a task text should reuse its existing task record');
assert.equal(textChanged.tasks[0].id, taskId);
assert.equal(textChanged.tasks[0].sourceKey, legacyTask.sourceKey, 'legacy source keys stay stable while task text changes');
assert.equal(textChanged.tasks[0].text, '新任务');
assert.deepEqual([...textChanged.changedTaskIds], [taskId]);

const deletedAfterTextChange = taskReconcileContext.tombstoneLinkedTasks(textChanged.tasks, entryId, '2026-08-21T11:00:00.000Z');
assert.equal(deletedAfterTextChange[0].deletedAt, '2026-08-21T11:00:00.000Z');
const restoredAfterImport = taskReconcileContext.reconcileJournalTasks(deletedAfterTextChange, [taskEntry], '2026-08-21T12:00:00.000Z');
assert.equal(restoredAfterImport.tasks.length, 1, 'restoring an entry should revive its original task rather than create another task');
assert.equal(restoredAfterImport.tasks[0].id, taskId);
assert.equal(restoredAfterImport.tasks[0].deletedAt, undefined);
assert.equal(restoredAfterImport.tasks[0].text, '新任务');
assert.equal(new Set(restoredAfterImport.tasks.map((task) => task.sourceKey)).size, restoredAfterImport.tasks.length, 'the restored task upload payload must have unique source keys');

const staleDuplicate = {
  ...restoredAfterImport.tasks[0],
  id: '33333333-3333-4333-8333-333333333333',
  createdAt: '2026-08-21T10:30:00.000Z',
  updatedAt: '2026-08-21T10:30:00.000Z',
};
const repairedDuplicate = taskReconcileContext.reconcileJournalTasks([
  { ...deletedAfterTextChange[0] },
  staleDuplicate,
], [taskEntry], '2026-08-21T12:30:00.000Z');
assert.equal(repairedDuplicate.tasks.length, 1, 'an exact duplicate legacy source key should be removed before upload');
assert.equal(repairedDuplicate.tasks[0].id, taskId, 'the original tombstoned task should be revived');
assert.deepEqual([...repairedDuplicate.removedTaskIds], [staleDuplicate.id]);

const mergeContext = vm.createContext({
  ...baseContext,
  state: {
    data: {
      entries: [{ ...localEntry }],
      summaries: {},
      periodSummaries: [],
      tasks: [],
      cloudSync: { dirty: { entries: [entryId], dailySummaries: [], periodSummaries: [], tasks: [] } },
    },
    cloud: { attachmentsSupported: null },
  },
  attachmentPayload() { return { files: [], tags: [], mood: '' }; },
  normalizeAttachments(value) { return value || []; },
  normalizeTags(value) { return value || []; },
  normalizeMood(value) { return value || ''; },
  summaryForDate() { return null; },
  remoteTaskToLocal() { return null; },
});
vm.runInContext(`
  function cloudDirty(kind) { return state.data.cloudSync.dirty[kind]; }
  function clearCloudDirty(kind, ids) {
    const processed = new Set(ids);
    state.data.cloudSync.dirty[kind] = cloudDirty(kind).filter((id) => !processed.has(id));
  }
  function markCloudDirty(kind, id) {
    const ids = cloudDirty(kind);
    if (!ids.includes(id)) ids.push(id);
  }
  function recordCloudActivity(message, level) { activity = { message, level }; }
`, mergeContext);
vm.runInContext([
  extractFunction(app, 'cloudUpdatedAt'),
  extractFunction(app, 'incomingWins'),
  extractFunction(app, 'conflictCopyTitle'),
  extractFunction(app, 'createEntryConflictCopy'),
  extractFunction(app, 'shouldPreserveDirtyEntry'),
  extractFunction(app, 'remoteEntryToLocal'),
  extractFunction(app, 'remoteSummaryToLocal'),
  extractFunction(app, 'remotePeriodToLocal'),
  extractFunction(app, 'mergeRemoteData'),
].join('\n\n'), mergeContext);
mergeContext.mergeRemoteData({
  entries: [{
    id: entryId,
    entry_date: localEntry.date,
    title: newerRemoteEntry.title,
    content: newerRemoteEntry.content,
    original_content: '',
    attachments: {},
    created_at: newerRemoteEntry.createdAt,
    updated_at: newerRemoteEntry.updatedAt,
    deleted_at: null,
  }],
});
assert.equal(mergeContext.state.data.entries.find((entry) => entry.id === entryId).content, newerRemoteEntry.content, 'the remote record should remain at its original id');
assert.equal(mergeContext.state.data.entries.find((entry) => entry.id === conflictId).content, localEntry.content, 'the dirty local record should become a separate conflict copy');
assert.deepEqual([...mergeContext.state.data.cloudSync.dirty.entries], [conflictId], 'only the conflict copy should wait for upload');
assert.match(mergeContext.activity.message, /同步冲突副本/);

const pushEchoContext = vm.createContext({
  ...baseContext,
  state: {
    data: {
      entries: [{ ...localEntry }],
      summaries: {},
      periodSummaries: [],
      tasks: [],
      cloudSync: { dirty: { entries: [entryId], dailySummaries: [], periodSummaries: [], tasks: [] } },
    },
    cloud: { attachmentsSupported: null },
  },
  attachmentPayload() { return { files: [], tags: [], mood: '' }; },
  normalizeAttachments(value) { return value || []; },
  normalizeTags(value) { return value || []; },
  normalizeMood(value) { return value || ''; },
  summaryForDate() { return null; },
  remoteTaskToLocal() { return null; },
});
vm.runInContext(`
  function cloudDirty(kind) { return state.data.cloudSync.dirty[kind]; }
  function clearCloudDirty(kind, ids) {
    const processed = new Set(ids);
    state.data.cloudSync.dirty[kind] = cloudDirty(kind).filter((id) => !processed.has(id));
  }
  function markCloudDirty(kind, id) {
    const ids = cloudDirty(kind);
    if (!ids.includes(id)) ids.push(id);
  }
  function recordCloudActivity(message, level) { activity = { message, level }; }
`, pushEchoContext);
vm.runInContext([
  extractFunction(app, 'cloudUpdatedAt'),
  extractFunction(app, 'incomingWins'),
  extractFunction(app, 'conflictCopyTitle'),
  extractFunction(app, 'createEntryConflictCopy'),
  extractFunction(app, 'shouldPreserveDirtyEntry'),
  extractFunction(app, 'remoteEntryToLocal'),
  extractFunction(app, 'remoteSummaryToLocal'),
  extractFunction(app, 'remotePeriodToLocal'),
  extractFunction(app, 'mergeRemoteData'),
].join('\n\n'), pushEchoContext);
pushEchoContext.mergeRemoteData({
  entries: [{
    id: entryId,
    entry_date: localEntry.date,
    title: newerRemoteEntry.title,
    content: newerRemoteEntry.content,
    original_content: '',
    attachments: {},
    created_at: newerRemoteEntry.createdAt,
    updated_at: newerRemoteEntry.updatedAt,
    deleted_at: null,
  }],
}, { preserveDirtyEntryConflicts: false });
assert.equal(pushEchoContext.state.data.entries.length, 1, 'a server echo of this device\'s own save must not create a duplicate conflict copy');
assert.equal(pushEchoContext.state.data.entries[0].id, entryId);

assert.match(app, /function deleteEntryDetail\(\)/, 'the detail dialog needs a delete handler');
assert.match(app, /tombstoneJournalEntry\(entry, now\)/, 'deleting an entry should write a tombstone');
assert.match(app, /elements\.deleteEntryDetail\?\.addEventListener\('click', deleteEntryDetail\)/, 'the detail delete button should be bound');
assert.match(app, /elements\.importButton\?\.addEventListener\('click', \(\) => elements\.importInput\.click\(\)\)/, 'the visible import button should open the file picker');
assert.match(app, /\[\.\.\.newEntries, \.\.\.mergedEntries\]\.forEach\(\(entry\) => markCloudDirty\('entries', entry\.id\)\)/, 'new and merged imported entries should both enter the sync queue');
assert.match(app, /if \(!quiet \|\| isNewError\) recordCloudActivity\(`同步失败：\$\{message\}`, 'error'\);/, 'the first quiet failure should be recorded visibly');

console.log('Data integrity regression checks passed');
