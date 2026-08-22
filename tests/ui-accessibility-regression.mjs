import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [index, indexHtm, styles] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('index.htm', root), 'utf8'),
  readFile(new URL('styles.css', root), 'utf8'),
]);

assert.equal(indexHtm, index, 'index.htm must remain an exact mirror of index.html');
assert.doesNotMatch(styles, /fonts\.googleapis\.com|@import\s+url\(/, 'the CSP must not block a remote font stylesheet');
assert.match(index, /<button id="import-button" class="top-text-action import-button" type="button" aria-controls="import-input">导入<\/button>/);
assert.match(index, /<input id="import-input" type="file" accept="application\/json,\.json" hidden \/>/);
assert.doesNotMatch(index, /<label class="top-text-action import-label" for="import-input">导入<\/label>/);
assert.match(index, /<button id="delete-entry-detail" type="button" class="quiet-button danger-button">删除这条记录<\/button>/);
assert.match(styles, /--font-sans:/);
assert.match(styles, /--font-serif:/);
assert.match(styles, /--font-mono:/);
assert.match(styles, /\.app-shell\s*\{[^}]*width:\s*min\(calc\(100%\s*-\s*28px\),\s*620px\)/s);
assert.match(styles, /\.today-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
assert.match(styles, /\.today-grid\s*>\s*\*\s*\{[^}]*min-width:\s*0/s);
assert.match(styles, /\.calendar-day\s*\{[^}]*aspect-ratio:\s*auto[^}]*min-height:\s*38px/s);
assert.match(styles, /\.top-text-action,\s*\.top-search-action\s*\{[^}]*min-height:\s*40px/s);
assert.match(styles, /\.top-search-action\s*\{[^}]*width:\s*40px[^}]*height:\s*40px/s);

console.log('UI accessibility regression checks passed');
