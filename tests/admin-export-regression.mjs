import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [index, indexHtm, app, styles, buildScript, packageJson] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('index.htm', root), 'utf8'),
  readFile(new URL('app.js', root), 'utf8'),
  readFile(new URL('styles.css', root), 'utf8'),
  readFile(new URL('scripts/build-mobile-web.mjs', root), 'utf8'),
  readFile(new URL('package.json', root), 'utf8'),
]);

assert.equal(indexHtm, index, 'both entry files must expose the same export controls');
assert.match(index, /id="admin-download-json"[^>]*>下载 JSON<\/button>/);
assert.match(index, /id="admin-download-excel"[^>]*>下载 Excel<\/button>/);
assert.match(index, /src="\.\/admin-export\.js\?release=/);
assert.doesNotMatch(index, /id="admin-raw-data"/, 'administrator page should show readable cards instead of raw JSON');
assert.match(app, /function downloadSelectedAdminUser\(format\)/);
assert.match(app, /SuijianAdminExport/);
assert.match(app, /elements\.adminDownloadJson.*addEventListener/);
assert.match(app, /elements\.adminDownloadExcel.*addEventListener/);
assert.doesNotMatch(app, /elements\.adminRawData/);
assert.match(styles, /\.admin-export-actions/);
assert.match(buildScript, /'admin-export\.js'/);
assert.match(packageJson, /tests\/admin-export-regression\.mjs/);

await import(new URL(`admin-export.js?test=${Date.now()}`, root));
const exporter = globalThis.SuijianAdminExport;
assert.ok(exporter, 'browser export helper should be available');

const fixture = {
  user: {
    id: 'user-1',
    email: 'member@example.test',
    created_at: '2026-09-09T12:00:00Z',
    credential: { providers: ['email'] },
  },
  data: {
    entries: [{ id: 'entry-1', entry_date: '2026-09-09', title: '测试标题', content: '日记内容 <&>', original_content: '原始文本', mood: '平静', tags: ['工作', '学习'], attachments: [{ name: 'note.txt' }], updated_at: '2026-09-09T13:00:00Z' }],
    drafts: [{ id: 'draft-1', draft_date: '2026-09-09', payload: { content: '草稿内容' }, updated_at: '2026-09-09T13:10:00Z' }],
    daily_summaries: [], period_summaries: [], tasks: [], backups: [], attachments: [],
    ai_settings: { config: { provider: 'deepseek', model: 'deepseek-chat', apiKey: 'must-not-export' }, api_key_configured: true },
  },
};

const json = exporter.createJsonExport(fixture.user, fixture.data, new Date('2026-09-09T14:00:00Z'));
assert.equal(json.mimeType, 'application/json;charset=utf-8');
assert.match(json.fileName, /^suijian-member-example-test-2026-09-09\.json$/);
const parsed = JSON.parse(json.text);
assert.equal(parsed.data.entries[0].content, fixture.data.entries[0].content);
assert.equal(parsed.data.ai_settings.config.apiKey, undefined, 'defensive export must strip an API key if an old server returns one');
assert.equal(parsed.data.ai_settings.api_key_configured, true);

const excel = exporter.createExcelExport(fixture.user, fixture.data, new Date('2026-09-09T14:00:00Z'));
assert.equal(excel.mimeType, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
assert.match(excel.fileName, /^suijian-member-example-test-2026-09-09\.xlsx$/);
assert.deepEqual(Array.from(excel.bytes.slice(0, 4)), [0x50, 0x4b, 0x03, 0x04], 'Excel output must be a real ZIP-based XLSX workbook');
assert.ok(excel.sheetNames.includes('日记'));
const workbookText = new TextDecoder().decode(excel.bytes);
assert.match(workbookText, /测试标题/);
assert.match(workbookText, /日记内容 &lt;&amp;&gt;/, 'cell text must be XML escaped');
assert.doesNotMatch(workbookText, /must-not-export/);

console.log('Administrator JSON and Excel export regression checks passed');
