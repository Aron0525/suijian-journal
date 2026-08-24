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

assert.equal(index, indexHtm, 'installed PWA entry should match index.html');
assert.match(index, /id="editor-ai-diff"/);
assert.match(index, /带标记的版本/);
assert.match(index, /纯文字版本/);
assert.doesNotMatch(index, /id="editor-ai-original"/);
assert.doesNotMatch(index, /id="ai-suggestion-paragraphs"/);
assert.match(index, /id="clear-draft-library"/);
assert.match(app, /function removeDraftFromLibrary\(/);
assert.match(app, /function clearDraftLibrary\(/);
assert.match(styles, /\.ai-diff-removed\s*\{[^}]*text-decoration:\s*line-through/s);
assert.match(styles, /\.ai-diff-added\s*\{[^}]*background:/s);

const context = vm.createContext({ Intl, Array, Math, String, Number, Set });
vm.runInContext([
  extractFunction(app, 'tokenizeDiffText'),
  extractFunction(app, 'appendDiffSegment'),
  extractFunction(app, 'buildMarkedDiffSegments'),
].join('\n\n'), context);

const replacement = context.buildMarkedDiffSegments('今天去散步。', '今天去慢跑。');
assert.ok(replacement.some((part) => part.type === 'removed' && part.text === '散步'), 'removed text should remain available for a strike-through marker');
assert.ok(replacement.some((part) => part.type === 'added' && part.text === '慢跑'), 'inserted text should receive a highlight marker');
assert.equal(replacement.map((part) => part.text).join(''), '今天去散步慢跑。', 'the marked representation should retain both the removed and added text');

const insertion = context.buildMarkedDiffSegments('今天写日记。', '今天认真写日记。');
assert.ok(insertion.some((part) => part.type === 'added' && part.text === '认真'), 'an insertion should be represented without deleting unchanged text');

const unchanged = context.buildMarkedDiffSegments('保持原样。', '保持原样。');
assert.equal(JSON.stringify([...unchanged]), JSON.stringify([{ type: 'equal', text: '保持原样。' }]), 'unchanged content should not receive artificial diff markers');

console.log('AI suggestion diff regression checks passed');
