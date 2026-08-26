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
  'toggle-entry-mood', 'toggle-entry-tags', 'entry-mood-panel', 'entry-tags-panel',
  'entry-mood', 'clear-entry-mood', 'entry-tags', 'add-entry-tag', 'entry-tag-list',
  'toggle-entry-detail-mood', 'toggle-entry-detail-tags', 'entry-detail-mood-panel', 'entry-detail-tags-panel',
  'entry-detail-mood', 'clear-entry-detail-mood', 'entry-detail-tags', 'add-entry-detail-tag', 'entry-detail-tag-list',
]) {
  assert.match(index, new RegExp(`id="${id}"`), `${id} should be available`);
}
for (const oldId of ['entry-work-content', 'organize-work-content', 'clear-work-content', 'work-ai-result', 'entry-detail-work-content']) {
  assert.doesNotMatch(index, new RegExp(`id="${oldId}"`), `${oldId} should be removed`);
}
assert.match(index, /class="metadata-picker-toggle"/);
assert.match(index, /data-mood-target="entry"/);
assert.match(index, /data-mood-target="detail"/);
assert.match(index, /aria-expanded="false"/);
assert.doesNotMatch(index, /当天工作内容（可选）/);
assert.doesNotMatch(index, /<select id="entry-mood"/, 'mood should support a typed custom value as well as presets');
assert.match(index, /list="journal-mood-options"/);

for (const name of ['normalizeMood', 'normalizeTags', 'renderTagEditor', 'addTagFromInput', 'metadataPickerControls', 'updateMetadataPicker', 'toggleMetadataPicker', 'chooseMood']) {
  assert.match(app, new RegExp(`function ${name}\\(`), `${name} should support the compact metadata picker`);
}
for (const name of ['organizeWorkContentWithAI', 'applyWorkAiSuggestion', 'dismissWorkAiSuggestion', 'clearWorkContent']) {
  assert.doesNotMatch(app, new RegExp(`function ${name}\\(`), `${name} should be removed with work content`);
}
assert.match(app, /document\.querySelectorAll\('\.mood-choice'\)/);
assert.match(app, /closeMetadataPickers\('entry'\)/);
assert.match(styles, /\.metadata-picker-toggle/);
assert.match(styles, /\.metadata-picker-panel/);
assert.match(styles, /\.mood-choice-list/);
assert.doesNotMatch(styles, /\.work-ai-result/);

const defaultOrganizePrompt = app.match(/const DEFAULT_ORGANIZE_PROMPT = `([\s\S]*?)`;/)?.[1] ?? '';
const defaultSummaryPrompt = app.match(/const DEFAULT_SUMMARY_PROMPT = `([\s\S]*?)`;/)?.[1] ?? '';
assert.match(defaultOrganizePrompt, /你只负责改善表达，不重写经历/);
assert.match(defaultOrganizePrompt, /只要不能确定，就保留原有说法/);
assert.match(defaultSummaryPrompt, /只说明“我做了什么”和“我想了什么”/);
assert.match(defaultSummaryPrompt, /不写反思、评价、建议、鼓励、心理分析或结尾总结/);
assert.doesNotMatch(defaultOrganizePrompt, /【待确认：……】/);
assert.doesNotMatch(defaultSummaryPrompt, /【待确认：……】/);

const normalizeContext = vm.createContext({
  MAX_ENTRY_MOOD_CHARS: 18,
  String,
});
vm.runInContext([
  extractFunction(app, 'normalizeMood'),
].join('\n\n'), normalizeContext);
assert.equal(normalizeContext.normalizeMood('  专注  '), '专注', 'a custom mood should be saved instead of discarded');
assert.equal(normalizeContext.normalizeMood(''), '', 'mood stays optional');

console.log('Optional entry details regression checks passed');
