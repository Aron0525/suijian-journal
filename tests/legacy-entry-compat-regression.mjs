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

assert.match(app, /const LEGACY_ENTRY_DETAILS_PREFIX = 'suijian-entry-details-v1:'/);
assert.match(app, /function legacyEntryDetails\(/);
assert.match(app, /function legacyEntryOriginalContent\(/);
assert.match(app, /state\.cloud\.attachmentsSupported === false \? legacyEntryOriginalContent\(entry\)/);

const context = vm.createContext({
  LEGACY_ENTRY_DETAILS_PREFIX: 'suijian-entry-details-v1:',
  state: { cloud: { attachmentsSupported: false } },
  normalizeAttachments(value) { return Array.isArray(value) ? value : []; },
  normalizeTags(value) { return Array.isArray(value) ? value : []; },
  normalizeMood(value) { return String(value || ''); },
  normalizeWorkContent(value) { return String(value || ''); },
  attachmentPayload(value) { return value || { files: [], tags: [], mood: '', workContent: '' }; },
  cloudAttachmentPayload() { throw new Error('legacy path should not write the missing attachments column'); },
});
vm.runInContext([
  extractFunction(app, 'legacyEntryDetails'),
  extractFunction(app, 'legacyEntryOriginalContent'),
  extractFunction(app, 'remoteEntryToLocal'),
  extractFunction(app, 'entryToCloud'),
].join('\n\n'), context);

const entry = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  date: '2026-09-02',
  title: '兼容附件',
  content: '正文',
  originalContent: '整理前原文',
  tags: ['项目'],
  mood: '平静',
  workContent: '完成同步',
  attachments: [{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'note.png', type: 'image/png', size: 12, dataUrl: 'data:image/png;base64,AAAA' }],
  createdAt: '2026-09-02T00:00:00.000Z',
  updatedAt: '2026-09-02T01:00:00.000Z',
};
const cloud = context.entryToCloud(entry, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
assert.match(cloud.original_content, /^suijian-entry-details-v1:/, 'compatibility data must live in an existing RLS-protected column');
assert.equal('attachments' in cloud, false, 'legacy write must not reference a missing column');
const local = context.remoteEntryToLocal({
  ...cloud,
  entry_date: cloud.entry_date,
  created_at: cloud.created_at,
  updated_at: cloud.updated_at,
  deleted_at: null,
});
assert.equal(local.originalContent, entry.originalContent);
assert.deepEqual([...local.tags], entry.tags);
assert.equal(local.mood, entry.mood);
assert.equal(local.workContent, entry.workContent);
assert.deepEqual(JSON.parse(JSON.stringify(local.attachments)), entry.attachments);

console.log('Legacy entry compatibility regression checks passed');
