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
assert.match(index, /<nav class="mobile-page-nav" aria-label="主页分区">[\s\S]*href="#today-view"[\s\S]*href="#calendar-page"[\s\S]*href="#archive-page"/);
assert.match(index, /向下滑动查看日历/);
assert.match(index, /向下滑动查看日记档案/);
assert.match(styles, /@media \(max-width: 760px\) \{[\s\S]*html \{[^}]*scroll-snap-type:\s*y mandatory/s);
assert.match(styles, /\.home-page \{[^}]*min-height:\s*100svh[^}]*scroll-snap-align:\s*start[^}]*scroll-snap-stop:\s*always/s);
assert.match(styles, /\.home-page-archive \.calendar-archive-list \{[^}]*overflow-y:\s*auto/s);
assert.match(styles, /\.mobile-page-nav\s*\{[^}]*display:\s*grid/s);
assert.match(app, /calendarPage:\s*document\.querySelector\('#calendar-page'\)/);
assert.match(app, /archivePage:\s*document\.querySelector\('#archive-page'\)/);
assert.match(app, /function scrollToHomePage\(pageId/);
assert.match(app, /scrollToHomePage\('archive-page'/);

console.log('Mobile homepage paging regression checks passed');
