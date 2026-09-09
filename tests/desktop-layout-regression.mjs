import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const styles = await readFile(new URL('styles.css', root), 'utf8');

const desktopBlock = styles.match(/\/\* 桌面端双栏工作台 \*\/[\s\S]*?@media \(min-width: 761px\) \{([\s\S]*?)\n\}/)?.[1] || '';

assert.ok(desktopBlock, 'desktop layout must have an isolated min-width breakpoint');
assert.match(desktopBlock, /\.journal-workspace\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(320px,\s*360px\)/s);
assert.match(desktopBlock, /\.home-page-calendar\s*\{[^}]*padding-top:\s*clamp\(144px,\s*11vw,\s*157px\)[^}]*grid-row:\s*1\s*\/\s*span\s*2/s);
assert.match(desktopBlock, /\.home-page-calendar\s+\.today-calendar\s*\{[^}]*position:\s*sticky[^}]*top:\s*24px/s);
assert.match(desktopBlock, /\.home-page-archive\s*\{[^}]*grid-column:\s*1/s);
assert.match(desktopBlock, /\.editor-panel\s+textarea\s*\{[^}]*min-height:\s*240px/s);
assert.match(desktopBlock, /\.top-tools\s*\{[^}]*border:\s*1px\s+solid\s+var\(--line\)/s);

const mobileBlock = styles.match(/@media \(max-width: 760px\) \{([\s\S]*?)\n\}/)?.[1] || '';
assert.match(mobileBlock, /\.home-page-archive\s*\{[^}]*grid-column:\s*auto/s, 'mobile archive must stay in natural single-column flow');

console.log('Desktop layout regression checks passed');
