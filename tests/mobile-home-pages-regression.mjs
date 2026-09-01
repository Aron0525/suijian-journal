import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [index, indexHtm, styles, app] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('index.htm', root), 'utf8'),
  readFile(new URL('styles.css', root), 'utf8'),
  readFile(new URL('app.js', root), 'utf8'),
]);

assert.equal(indexHtm, index, 'index.htm must mirror the mobile homepage structure');
assert.match(index, /<section id="today-view" class="view active home-page home-page-writing"/);
assert.match(index, /<section id="calendar-page" class="home-page home-page-calendar"/);
assert.match(index, /<section id="archive-page" class="home-page home-page-archive"/);
assert.doesNotMatch(index, /mobile-page-nav|mobile-scroll-cue/, 'mobile home must be one naturally scrolling page without page-switch controls');
assert.doesNotMatch(styles, /scroll-snap(?:-type|-align|-stop)?\s*:/, 'mobile home must not trap scrolling with page snapping');
assert.doesNotMatch(styles, /\.home-page-archive\s*\{[^}]*height:\s*100svh[^}]*overflow:\s*hidden/s, 'archive must grow naturally so entries remain reachable');
assert.match(styles, /@media \(max-width: 760px\) \{[\s\S]*\.topbar \{[^}]*position:\s*relative[^}]*z-index:\s*[5-9]/s, 'the account toolbar must stay above page content on mobile');
assert.match(app, /calendarPage:\s*document\.querySelector\('#calendar-page'\)/);
assert.match(app, /archivePage:\s*document\.querySelector\('#archive-page'\)/);
assert.match(app, /function scrollToHomePage\(pageId/);
assert.match(app, /scrollToHomePage\('archive-page'/);

console.log('Mobile homepage natural-scroll regression checks passed');
