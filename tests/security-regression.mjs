import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, serviceWorker, edgeFunction, githubPagesWorkflow, manifest, index, indexHtm, schema, styles, capacitorConfig, mobileBuildScript, packageJson, nativeBuildScript, mobileVersion] = await Promise.all([
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../sw.js', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/functions/ai-proxy/index.ts', import.meta.url), 'utf8'),
  readFile(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8'),
  readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../index.htm', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../capacitor.config.ts', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/build-mobile-web.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../package.json', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/build-native-update-manifest.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../mobile-version.json', import.meta.url), 'utf8'),
]);

assert.equal(indexHtm, index, 'index.htm is the installed PWA entry point and must match index.html');

assert.match(app, /const SESSION_REMEMBER_MS = 2 \* 24 \* 60 \* 60 \* 1000/);
assert.match(app, /const AUTO_SYNC_INTERVAL_MS = 10 \* 60 \* 1000/);
assert.match(app, /const MOBILE_OTA_MANIFEST_URL = 'https:\/\/aron0525\.github\.io\/suijian-journal\/app-update\.json'/);
assert.match(app, /function nativeUpdater\(\)/);
assert.match(app, /async function checkNativeAppUpdate\(\{ quiet = true \} = \{\}\)/);
assert.match(app, /updater\.download\(\{ url: manifest\.url, version: manifest\.version, checksum: manifest\.checksum \}\)/);
assert.match(app, /updater\.next\(\{ id: bundle\.id \}\)/);
assert.match(app, /updater\.notifyAppReady\(\)/);
assert.match(app, /void initializeNativeUpdates\(\)/);
assert.match(app, /const NATIVE_APP_UPDATE_MANIFEST_URL = 'https:\/\/aron0525\.github\.io\/suijian-journal\/native-app-update\.json'/);
assert.match(app, /function checkNativeInstallerUpdate\(\{ quiet = true \} = \{\}\)/);
assert.match(app, /function openNativeInstallerDownload\(\)/);
assert.match(app, /function checkMobileUpdatesManually\(\)/);
assert.match(app, /function isTrustedNativeInstallerUpdate\(manifest\)/);
assert.match(app, /native-app-update\.json/);

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
assert.match(app, /function handleCloudSyncButton\(\) \{\s*if \(!state\.cloud\.session\)/);
const directSyncHandler = app.match(/function handleCloudSyncButton\(\) \{[\s\S]+?\n\}/)?.[0] ?? '';
assert.ok(directSyncHandler, 'direct sync handler should exist');
assert.match(directSyncHandler, /void syncCloud\(\)/);
assert.doesNotMatch(directSyncHandler, /openCloudSyncDialog/);
assert.match(app, /syncOpenAccount/);
assert.doesNotMatch(app, /syncConfigForm/);
assert.match(app, /function recordCloudActivity\(message/);
assert.match(app, /persistDataChange/);
assert.doesNotMatch(serviceWorker, /caches\.match\(event\.request\)/);
assert.match(serviceWorker, /if \(url\.origin !== self\.location\.origin\) return/);
assert.match(serviceWorker, /cache: 'no-store'/);
assert.match(serviceWorker, /suijian-pwa-v25/);
assert.match(index, /app\.js\?release=20260812-journal-completion/);
assert.match(index, /id="account-dialog"/);
assert.match(index, /id="mobile-update-panel"/);
assert.match(index, /id="check-mobile-update"/);
assert.match(index, /id="download-mobile-update"/);

assert.match(index, /id="sync-dialog"/);
assert.match(index, /id="sync-open-account"/);
assert.doesNotMatch(index, /id="supabase-url"/);
assert.match(app, /sw\.js\?release=20260812-journal-completion/);
assert.match(index, /connect-src 'self' https:\/\/\*\.supabase\.co https:\/\/aron0525\.github\.io/);
assert.match(edgeFunction, /parsed\.protocol !== 'https:'/);
assert.match(edgeFunction, /allowedAiHosts\(\)\.has/);
assert.match(edgeFunction, /createSupabaseContext\(request, \{ auth: 'user' \}\)/);
assert.match(edgeFunction, /export default \{/);
assert.match(edgeFunction, /if \(request\.method === 'OPTIONS'\)/);
assert.match(schema, /grant select, insert, update, delete on table public\.journal_entries, public\.daily_summaries, public\.period_summaries to authenticated;/);
assert.match(styles, /\.sync-gate\[hidden\]\s*\{\s*display:\s*none;/);
assert.match(styles, /\.mobile-update-card/);
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
const topTools = index.match(/<div class="top-tools">([\s\S]+?)<\/div>/)?.[1] ?? '';
assert.match(topTools, /search-panel-button[\s\S]*summary-panel-button[\s\S]*review-panel-button[\s\S]*export-button[\s\S]*import-input[\s\S]*backup-panel-button[\s\S]*cloud-sync-button[\s\S]*model-config-button[\s\S]*cloud-account-button/);
assert.match(topTools, /id="search-panel-button" class="top-search-action"[^>]*aria-label="搜索日记"[\s\S]*?<svg/);
assert.doesNotMatch(topTools, /id="search-panel-button"[^>]*>搜索</);
assert.match(topTools, /id="summary-panel-button" class="top-text-action"/);
assert.match(topTools, /id="review-panel-button" class="top-text-action"/);
assert.match(topTools, /id="export-button" class="top-text-action"/);
assert.match(topTools, /class="top-text-action import-label" for="import-input"/);
assert.match(topTools, /id="cloud-sync-button" class="top-text-action"/);
assert.match(topTools, /id="model-config-button" class="top-text-action"/);
assert.match(topTools, /id="cloud-account-button" class="top-text-action account-action"/);
assert.equal((topTools.match(/class="top-tool-divider"/g) ?? []).length, 8, 'top actions should use eight vertical separators');
assert.match(index, /id="cloud-account-button"[^>]*>账号</);
assert.doesNotMatch(styles, /#export-button\s*\{\s*display:\s*none;/);
assert.match(styles, /\.top-tool-divider\s*\{[^}]*width:\s*1px/);
assert.match(styles, /\.top-search-action svg/);
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
assert.match(githubPagesWorkflow, /actions\/setup-java@v4/);
assert.match(githubPagesWorkflow, /android-actions\/setup-android@v3/);
assert.match(githubPagesWorkflow, /SUJIAN_ANDROID_KEYSTORE_BASE64/);
assert.match(githubPagesWorkflow, /npm run build:android/);
assert.match(githubPagesWorkflow, /actions\/upload-pages-artifact@v3/);
assert.match(githubPagesWorkflow, /path: dist-mobile/);
assert.match(githubPagesWorkflow, /actions\/deploy-pages@v4/);
assert.match(capacitorConfig, /CapacitorUpdater/);
assert.match(capacitorConfig, /autoUpdate: 'off'/);
assert.match(mobileBuildScript, /app-update\.json/);
assert.match(mobileBuildScript, /suijian-web-\$\{release\}\.zip/);
assert.match(mobileBuildScript, /createHash\('sha256'\)/);
assert.match(packageJson, /"@capacitor\/app"/);
assert.match(packageJson, /"build:android"/);
assert.match(nativeBuildScript, /native-app-update\.json/);
assert.match(nativeBuildScript, /suijian-android-v\$\{versionName\}\.apk/);
assert.match(mobileVersion, /"versionCode": 2/);
assert.match(mobileVersion, /"versionName": "1\.1\.0"/);
assert.match(packageJson, /"@capgo\/capacitor-updater"/);
assert.match(manifest, /"start_url": "\.\/index\.htm"/);
assert.match(manifest, /"scope": "\.\/"/);

assert.match(index, /id="add-attachment"/);
assert.match(index, /id="attachment-input"[^>]*multiple/);
assert.match(index, /id="draft-attachments"/);
assert.match(app, /const MAX_ATTACHMENT_COUNT = 4/);
assert.match(app, /function normalizeAttachments\(value\)/);
assert.match(app, /async function attachFiles\(files\)/);
assert.match(app, /function renderDraftAttachments\(attachments\)/);
assert.match(app, /function renderEntryAttachments\(attachments\)/);
assert.match(app, /function scheduleAutomaticBackup\(\)/);
assert.match(app, /indexedDB\.open\(AUTO_BACKUP_DB/);
assert.match(app, /attachments: normalizeAttachments\(draft\.attachments\)/);
assert.match(app, /const entryColumns = 'id,entry_date,title,content,original_content,attachments,created_at,updated_at,deleted_at'/);
assert.match(app, /attachments: normalizeAttachments\(entry\.attachments\)/);
assert.match(schema, /attachments jsonb not null default '\[\]'::jsonb/);
assert.match(styles, /\.editor-attachment-add/);
assert.match(styles, /\.attachment-preview/);

assert.match(index, /id="draft-library-button"/);
assert.match(index, /id="draft-library-dialog"/);
assert.match(index, /id="draft-library-list"/);
assert.match(app, /function savedDrafts\(\)/);
assert.match(app, /function openDraftLibrary\(\)/);
assert.match(app, /function pasteDraftIntoEditor\(storageKey\)/);
assert.match(app, /localStorage\.removeItem\(storageKey\)/);
assert.match(app, /function updateDraftLibraryButton\(\)/);
assert.match(app, /function editorDraft\(\)/);
assert.match(app, /state\.pastedDraft = saved\.draft/);
assert.match(app, /草稿已粘贴到输入框，原草稿已删除/);
assert.match(app, /function saveNewEntry\(\) \{\s*clearTimeout\(draftTimer\)/);
assert.match(styles, /\.draft-library-button/);
assert.match(styles, /\.draft-library-item/);

assert.match(index, /id="review-panel-button"/);
assert.match(index, /id="review-dialog"/);
assert.match(index, /id="review-year"/);
assert.match(index, /id="review-monthly-activity"/);
assert.match(index, /id="review-emotion-trend"/);
assert.match(index, /id="review-keywords"/);
assert.match(index, /id="reminder-form"/);
assert.match(index, /id="reminder-enabled"/);
assert.match(index, /id="reminder-time"/);
assert.match(app, /const REMINDER_SETTINGS_KEY/);
assert.match(app, /function journalReview\(year\)/);
assert.match(app, /function commonKeywords\(entries\)/);
assert.match(app, /function renderReview\(\)/);
assert.match(app, /function scheduleNativeReminders\(settings,/);
assert.match(app, /function startBrowserReminder\(\)/);
assert.match(app, /function saveReminderSettings\(\)/);
assert.match(app, /LocalNotifications/);
assert.match(styles, /\.review-dialog/);
assert.match(styles, /\.reminder-card/);
assert.match(packageJson, /"@capacitor\/local-notifications"/);

console.log('JavaScript security regression checks passed');
