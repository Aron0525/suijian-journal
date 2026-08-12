import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, index, indexHtm, styles, schema] = await Promise.all([
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../index.htm', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'),
]);

assert.equal(index, indexHtm, 'installed PWA entry should match index.html');

for (const id of ['entry-mood', 'entry-tags', 'search-start-date', 'search-end-date', 'search-tag-filter', 'search-mood-filter', 'search-has-attachment', 'backup-panel-button', 'backup-dialog', 'backup-snapshot-list', 'review-range-mode', 'review-heatmap', 'review-task-list', 'reminder-snooze', 'reminder-skip-today']) {
  assert.match(index, new RegExp(`id="${id}"`), `${id} should be available in the product UI`);
}

for (const name of ['normalizeTags', 'normalizeMood', 'searchEntries', 'appendHighlightedText', 'reviewRange', 'reviewTasks', 'renderReviewHeatmap', 'extractJournalTasks', 'restoreAutomaticBackup', 'exportMarkdown', 'exportZipBackup', 'promoteEntryAttachmentsToCloud', 'uploadAttachmentToCloud', 'applyAiSuggestionParagraph', 'snoozeReminder', 'skipReminderToday']) {
  assert.match(app, new RegExp(`function ${name}\\(`), `${name} should implement its visible behavior`);
}

assert.match(app, /tags: normalizeTags\(draft\.tags\)/);
assert.match(app, /mood: normalizeMood\(draft\.mood\)/);
assert.match(app, /storagePath/);
assert.match(app, /journal-attachments/);
assert.match(app, /dataset\.suijianAiParagraph/);
assert.match(app, /日记归档\.md/);
assert.match(app, /application\/zip/);
assert.match(app, /function cloudAttachmentPayload\(entry\)/);
assert.match(schema, /files, tags, mood/);
assert.match(schema, /create table if not exists public\.journal_tasks/);
assert.match(schema, /insert into storage\.buckets/);
assert.match(schema, /journal-attachments/);
assert.match(styles, /\.entry-metadata/);
assert.match(styles, /\.search-filters/);
assert.match(styles, /\.review-heatmap/);
assert.match(styles, /\.backup-snapshot/);
assert.match(styles, /\.ai-compare-grid/);

console.log('Journal completion regression checks passed');
