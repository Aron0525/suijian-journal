import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, index, styles] = await Promise.all([
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
]);

const sourceMatch = app.match(/function writingRhythm\(\) \{[\s\S]+?\n\}\n\nfunction draftKey/);
assert.ok(sourceMatch, 'writingRhythm implementation should exist');
const writingRhythmSource = sourceMatch[0].replace(/\n\nfunction draftKey$/, '');
const calculate = new Function('state', 'isDateKey', 'localDateKey', 'parseDateKey', `${writingRhythmSource}\nreturn writingRhythm();`);
const reference = new Date('2026-08-11T12:00:00Z');
const isDateKey = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const localDateKey = (date = reference) => date.toISOString().slice(0, 10);
const parseDateKey = (key) => new Date(`${key}T12:00:00Z`);
const withEntries = (dates) => ({ data: { entries: dates.map((date) => ({ date })) } });

assert.deepEqual(calculate(withEntries(['2026-08-11', '2026-08-10', '2026-08-09', '2026-08-07', '2026-07-31']), isDateKey, localDateKey, parseDateKey), {
  streak: 3,
  monthDays: 4,
  totalDays: 5,
});
assert.deepEqual(calculate(withEntries(['2026-08-10', '2026-08-09']), isDateKey, localDateKey, parseDateKey), {
  streak: 2,
  monthDays: 2,
  totalDays: 2,
});
assert.deepEqual(calculate(withEntries(['2026-08-11', '2026-08-09']), isDateKey, localDateKey, parseDateKey), {
  streak: 1,
  monthDays: 2,
  totalDays: 2,
});
assert.match(index, /id="writing-streak"/);
assert.match(index, /id="writing-month-days"/);
assert.match(index, /id="writing-total-days"/);
assert.match(styles, /\.writing-rhythm/);
assert.match(app, /function render\(\) \{[\s\S]*?renderWritingRhythm\(\);/);

console.log('Writing rhythm regression checks passed');
