import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const [app, index, indexHtm, styles] = await Promise.all([
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../index.htm', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
]);

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
  const bodyStart = source.indexOf('{', parameterEnd);
  let depth = 0;
  for (let cursor = bodyStart; cursor < source.length; cursor += 1) {
    if (source[cursor] === '{') depth += 1;
    if (source[cursor] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, cursor + 1);
  }
  assert.fail(`${name} should have a closed function body`);
}

assert.equal(index, indexHtm, '两份 PWA 入口必须保持一致');
for (const id of [
  'entry-mood', 'clear-entry-mood', 'entry-tags', 'add-entry-tag', 'entry-tag-list',
  'entry-work-content', 'organize-work-content', 'clear-work-content', 'work-ai-result',
  'entry-detail-mood', 'clear-entry-detail-mood', 'entry-detail-tags', 'add-entry-detail-tag',
  'entry-detail-tag-list', 'entry-detail-work-content', 'clear-entry-detail-work-content',
]) {
  assert.match(index, new RegExp(`id="${id}"`), `${id} should be available as an optional-entry control`);
}
assert.match(index, /心情（可选）/);
assert.match(index, /标签（可选）/);
assert.match(index, /当天工作内容（可选）/);
assert.doesNotMatch(index, /<select id="entry-mood"/, 'mood should support a typed custom value as well as presets');
assert.match(index, /list="journal-mood-options"/);

for (const name of ['normalizeWorkContent', 'renderTagEditor', 'addTagFromInput', 'organizeWorkContentWithAI', 'applyWorkAiSuggestion', 'clearWorkContent']) {
  assert.match(app, new RegExp(`function ${name}\\(`), `${name} should support optional entry details`);
}
assert.match(app, /workContent: normalizeWorkContent\(draft\.workContent\)/);
assert.match(app, /workContent: normalizeWorkContent\(entry\.workContent\)/);
assert.match(app, /workContent: normalizeWorkContent\(payload\.workContent\)/);
assert.match(app, /entry\.workContent = workContent/);
assert.match(app, /当天工作内容：/);
assert.match(styles, /\.optional-entry-details/);
assert.match(styles, /\.tag-editor-chip-remove/);
assert.match(styles, /\.work-ai-result/);

const defaultOrganizePrompt = app.match(/const DEFAULT_ORGANIZE_PROMPT = `([\s\S]*?)`;/)?.[1] ?? '';
const defaultSummaryPrompt = app.match(/const DEFAULT_SUMMARY_PROMPT = `([\s\S]*?)`;/)?.[1] ?? '';
assert.match(defaultOrganizePrompt, /无法确定的信息保持原样，不改写、不补全/);
assert.match(defaultSummaryPrompt, /无法确定的内容不写入总结，不猜测、不补全/);
assert.doesNotMatch(defaultOrganizePrompt, /【待确认：……】/);
assert.doesNotMatch(defaultSummaryPrompt, /【待确认：……】/);

const normalizeContext = vm.createContext({
  MAX_ENTRY_MOOD_CHARS: 18,
  MAX_ENTRY_WORK_CONTENT_CHARS: 3000,
  String,
  normalizeTags(value) { return Array.isArray(value) ? value : []; },
});
vm.runInContext([
  extractFunction(app, 'normalizeMood'),
  extractFunction(app, 'normalizeWorkContent'),
  extractFunction(app, 'attachmentPayload'),
].join('\n\n'), normalizeContext);
assert.equal(normalizeContext.normalizeMood('  专注  '), '专注', 'a custom mood should be saved instead of discarded');
assert.equal(normalizeContext.normalizeMood(''), '', 'mood stays optional');
assert.equal(normalizeContext.normalizeWorkContent('  完成周报  '), '完成周报', 'work content should remain editable plain text');
assert.equal(normalizeContext.normalizeWorkContent(''), '', 'work content stays optional');
assert.equal(normalizeContext.attachmentPayload({ workContent: '  完成周报  ' }).workContent, '完成周报', 'work content should travel with the cloud JSON payload');

console.log('Optional entry details regression checks passed');
