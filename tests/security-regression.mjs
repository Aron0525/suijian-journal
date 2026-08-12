import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, serviceWorker, edgeFunction, githubPagesWorkflow, manifest, index, schema, styles] = await Promise.all([
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../sw.js', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/functions/ai-proxy/index.ts', import.meta.url), 'utf8'),
  readFile(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8'),
  readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
]);

assert.match(app, /const SESSION_REMEMBER_MS = 2 \* 24 \* 60 \* 60 \* 1000/);
assert.match(app, /const AUTO_SYNC_INTERVAL_MS = 10 \* 60 \* 1000/);
assert.match(app, /localStorage\.setItem\(CLOUD_SESSION_KEY/);
assert.match(app, /sessionStorage\.removeItem\(CLOUD_SESSION_KEY/);
assert.match(app, /rememberUntil/);
assert.match(app, /function startCloudAutoSync\(\)/);
assert.match(app, /window\.setInterval\(\(\) => syncCloud\(\{ quiet: true \}\), AUTO_SYNC_INTERVAL_MS\)/);
assert.match(app, /function syncBeforeLeaving\(\)/);
assert.match(app, /document\.addEventListener\('visibilitychange'/);
assert.match(app, /window\.addEventListener\('pagehide', syncBeforeLeaving\)/);
assert.match(app, /email_redirect_to: emailRedirectUrl\(\)/);
assert.match(app, /async function restoreCloudSessionFromAuthCallback\(\)/);
assert.match(app, /\/auth\/v1\/user/);
assert.match(app, /history\.replaceState/);
assert.match(app, /这台设备会保持登录两天；打开、回到前台和每 10 分钟都会自动同步/);
assert.match(app, /function validateCloudCredentials\(\)/);
assert.match(app, /const \{ apiKey: legacyApiKey, \.\.\.safeConfig \} = config/);
assert.match(app, /账号已切换，等待确认/);
assert.match(app, /cloudAccountButton/);
assert.match(app, /function openCloudAccountDialog\(\)/);
assert.match(app, /function openCloudSyncDialog\(\)/);
assert.match(app, /syncOpenAccount/);
assert.doesNotMatch(app, /syncConfigForm/);
assert.match(app, /function recordCloudActivity\(message/);
assert.match(app, /persistDataChange/);
assert.doesNotMatch(serviceWorker, /caches\.match\(event\.request\)/);
assert.match(serviceWorker, /if \(url\.origin !== self\.location\.origin\) return/);
assert.match(serviceWorker, /cache: 'no-store'/);
assert.match(serviceWorker, /suijian-pwa-v23/);
assert.match(index, /app\.js\?release=20260811-archive-jump/);
assert.match(index, /id="account-dialog"/);
assert.match(index, /id="sync-dialog"/);
assert.match(index, /id="sync-open-account"/);
assert.doesNotMatch(index, /id="supabase-url"/);
assert.match(app, /sw\.js\?release=20260811-archive-jump/);
assert.match(edgeFunction, /parsed\.protocol !== 'https:'/);
assert.match(edgeFunction, /allowedAiHosts\(\)\.has/);
assert.match(edgeFunction, /createSupabaseContext\(request, \{ auth: 'user' \}\)/);
assert.match(edgeFunction, /export default \{/);
assert.match(edgeFunction, /if \(request\.method === 'OPTIONS'\)/);
assert.match(schema, /grant select, insert, update, delete on table public\.journal_entries, public\.daily_summaries, public\.period_summaries to authenticated;/);
assert.match(styles, /\.sync-gate\[hidden\]\s*\{\s*display:\s*none;/);
assert.match(styles, /\.sync-auth-form\[hidden\]\s*\{\s*display:\s*none;/);
assert.match(index, /class="today-calendar card"/);
assert.match(index, /id="calendar-archive-list"/);
assert.match(index, /id="archive-jump-date"/);
assert.match(index, /id="archive-jump-button"/);
assert.doesNotMatch(index, /id="calendar-filter-start"/);
assert.doesNotMatch(index, /id="calendar-filter-end"/);
const archiveMarkup = index.match(/<section class="archive-section"[\s\S]+?<\/section>\n\s*<\/section>\n\s*<\/section>/)?.[0] ?? '';
assert.ok(archiveMarkup, 'calendar archive markup should exist');
assert.doesNotMatch(archiveMarkup, /日期范围/);
assert.match(index, /aria-label="搜索日记"/);
assert.match(index, /id="cloud-account-button"[^>]*>登录</);
assert.doesNotMatch(index, /id="day-summary"/);
assert.doesNotMatch(index, /id="entry-list"/);
assert.doesNotMatch(index, /今天的片段/);
assert.match(app, /renderWritingRhythm\(\);/);
assert.match(app, /function jumpToArchiveDate\(date\)/);
assert.match(app, /state\.archiveJumpDate = date/);
assert.doesNotMatch(app, /function applyCalendarRangeFilter\(\)/);
const archiveEntriesSource = app.match(/function calendarArchiveEntries\(\) \{[\s\S]+?\n\}/)?.[0] ?? '';
assert.ok(archiveEntriesSource, 'calendar archive entries implementation should exist');
assert.doesNotMatch(archiveEntriesSource, /calendarFilter/);
assert.match(styles, /\.archive-jump-bar/);
assert.match(styles, /\.calendar-archive-list\s*\{[^}]*max-height:\s*none;/);
assert.match(githubPagesWorkflow, /actions\/upload-pages-artifact@v3/);
assert.match(githubPagesWorkflow, /path: dist-mobile/);
assert.match(githubPagesWorkflow, /actions\/deploy-pages@v4/);
assert.match(manifest, /"start_url": "\.\/index\.htm"/);
assert.match(manifest, /"scope": "\.\/"/);

console.log('JavaScript security regression checks passed');
