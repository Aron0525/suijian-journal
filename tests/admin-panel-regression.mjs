import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [index, indexHtm, app, styles, schema, config, edge, grantsMigration, packageJson] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('index.htm', root), 'utf8'),
  readFile(new URL('app.js', root), 'utf8'),
  readFile(new URL('styles.css', root), 'utf8'),
  readFile(new URL('supabase/schema.sql', root), 'utf8'),
  readFile(new URL('supabase/config.toml', root), 'utf8'),
  readFile(new URL('supabase/functions/admin-panel/index.ts', root), 'utf8'),
  readFile(new URL('supabase/migrations/20260910000000_grant_admin_content_read.sql', root), 'utf8'),
  readFile(new URL('package.json', root), 'utf8'),
]);

assert.equal(indexHtm, index, 'both PWA entry files must expose the same administrator UI');
assert.match(index, /id="admin-entry-card"[^>]*hidden/);
assert.match(index, /id="admin-entry-status"[^>]*>正在核验权限<\/span>/);
assert.match(index, /id="admin-panel-button"[^>]*>进入管理员控制台<\/button>/);
assert.match(index, /id="admin-shortcut-button"[^>]*hidden[^>]*>管理<\/button>/, 'mobile and desktop toolbars need a direct administrator entry');
assert.match(index, /<dialog id="admin-dialog" class="workspace-dialog admin-dialog"/);
assert.match(index, /id="admin-refresh-users"/);
assert.match(index, /id="admin-user-list"/);
assert.match(index, /id="admin-user-detail"/);
assert.match(index, /id="admin-account-overview"/);
assert.match(index, /id="admin-entry-list"/);
assert.match(index, /id="admin-draft-list"/);
assert.match(index, /id="admin-summary-list"/);
assert.match(index, /id="admin-backup-list"/);
assert.match(index, /id="admin-raw-data"/);
assert.match(index, /id="admin-send-password-reset"/);
assert.match(index, /id="admin-toggle-user-suspension"/);
assert.match(index, /认证密码只保存不可逆哈希，原密码不可读取；需要时可发送重设密码邮件/);
assert.match(styles, /\.admin-dialog/);
assert.match(styles, /\.admin-user-data/);
assert.match(styles, /\.admin-entry-card/);
assert.match(styles, /\.admin-data-section/);
assert.match(styles, /\.admin-journal-record/);
assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.admin-dialog\s*\{[\s\S]*height:\s*calc\(100dvh - 12px\)/, 'administrator panel must use the full mobile viewport');

assert.match(app, /const ADMIN_FUNCTION_NAME = 'admin-panel';/);
assert.match(app, /const ADMIN_EMAIL = 'rili66@outlook\.com';/);
assert.match(app, /function isAdminSessionCandidate\(session/);
assert.match(app, /elements\.adminEntryCard\.hidden = !adminCandidate/);
assert.match(app, /elements\.adminShortcutButton\.hidden = !adminCandidate/);
assert.match(app, /elements\.adminEntryStatus\.textContent/);
assert.match(app, /async function checkAdminAccess\(\{ force = false \} = \{\}\)/);
assert.match(app, /if \(!force && state\.admin\.checkedUserId === userId/);
assert.match(app, /checkAdminAccess\(\{ force: true \}\)/);
assert.match(app, /permissionError/);
assert.match(app, /function emptyAdminState\(\)/);
assert.match(app, /function renderAdminPanel\(\)/);
assert.match(app, /function renderAdminDataSections\(/);
assert.match(app, /closeWorkspaceDialog\(elements\.accountDialog\)/, 'opening the administrator panel must close the mobile account dialog first');
assert.match(app, /async function adminRequest\(/);
assert.match(app, /adminRequest\('status'\)/);
assert.match(app, /adminRequest\('users'/);
assert.match(app, /adminRequest\('user'/);
assert.match(app, /adminRequest\('send_password_reset'/);
assert.match(app, /adminRequest\(suspended \? 'restore_user' : 'suspend_user'/);
assert.match(app, /elements\.adminPanelButton\?\.addEventListener\('click'/);
assert.match(app, /showToast\(`管理员权限核验失败/);
assert.match(app, /closeDialogOnBackdrop\(elements\.adminDialog, closeAdminDialog\)/);
assert.match(app, /state\.admin = emptyAdminState\(\)/);
assert.doesNotMatch(app, /SUPABASE_SERVICE_ROLE_KEY/);

assert.match(config, /\[functions\.admin-panel\]\s*\nverify_jwt = true/);
assert.match(schema, /create table if not exists public\.journal_admins/);
assert.match(schema, /create table if not exists public\.admin_audit_events/);
assert.match(schema, /revoke all on table public\.journal_admins, public\.admin_audit_events from anon, authenticated/);
assert.match(schema, /grant select, insert, update, delete on table public\.journal_admins, public\.admin_audit_events to service_role/);
assert.match(schema, /notify pgrst, 'reload schema'/);
assert.match(schema, /lower\(email\) = 'rili66@outlook\.com'/);
assert.match(edge, /const ADMIN_EMAIL = 'rili66@outlook\.com';/);
assert.match(edge, /'https:\/\/localhost'/, 'Capacitor Android uses https://localhost and must receive a matching CORS origin');
assert.match(edge, /SUPABASE_SERVICE_ROLE_KEY/);
assert.match(edge, /\.from\('journal_admins'\)/);
assert.match(edge, /\.upsert\(\{ user_id: data\.user\.id \}, \{ onConflict: 'user_id', ignoreDuplicates: true \}\)/);
assert.match(edge, /\.from\('admin_audit_events'\)/);
assert.match(edge, /async function audit\(/);
assert.match(edge, /async function listUsers\(/);
assert.match(edge, /async function userData\(/);
assert.match(edge, /userId = userId\.trim\(\)/);
assert.match(edge, /return await userData\(/, 'administrator data errors must be converted to a CORS-safe JSON response');
assert.match(edge, /return await listUsers\(/, 'user list errors must be converted to a CORS-safe JSON response');
assert.match(edge, /return await changeUserState\(/, 'administrator action errors must be converted to a CORS-safe JSON response');
assert.match(edge, /\.from\('journal_drafts'\)/);
assert.match(edge, /queryUserDataset\(/);
assert.match(edge, /data_warnings/);
assert.match(edge, /send_password_reset/);
assert.match(edge, /suspend_user/);
assert.match(edge, /restore_user/);
assert.match(edge, /delete config\.apiKey/);
assert.match(edge, /api_key_configured/);
assert.match(edge, /userId === actor\.id/);
assert.doesNotMatch(edge, /encrypted_password|password_hash|password\s*:/i);
assert.doesNotMatch(edge, /Access-Control-Allow-Origin': '\*'/);
assert.doesNotMatch(edge, /ADMIN_EMAIL\s*=\s*'\*'/);
assert.match(grantsMigration, /create table if not exists public\.journal_drafts/, 'production admin migration must repair deployments that missed cloud drafts');
assert.match(grantsMigration, /grant select[\s\S]*journal_entries[\s\S]*journal_drafts[\s\S]*journal_backups[\s\S]*ai_settings[\s\S]*to service_role/i);
assert.match(grantsMigration, /notify pgrst, 'reload schema'/);
assert.match(packageJson, /tests\/admin-panel-regression\.mjs/);

console.log('Administrator panel regression checks passed');
