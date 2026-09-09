import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [index, indexHtm, app, styles, schema, config, edge, packageJson] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('index.htm', root), 'utf8'),
  readFile(new URL('app.js', root), 'utf8'),
  readFile(new URL('styles.css', root), 'utf8'),
  readFile(new URL('supabase/schema.sql', root), 'utf8'),
  readFile(new URL('supabase/config.toml', root), 'utf8'),
  readFile(new URL('supabase/functions/admin-panel/index.ts', root), 'utf8'),
  readFile(new URL('package.json', root), 'utf8'),
]);

assert.equal(indexHtm, index, 'both PWA entry files must expose the same administrator UI');
assert.match(index, /id="admin-entry-card"[^>]*hidden/);
assert.match(index, /id="admin-entry-status"[^>]*>正在核验权限<\/span>/);
assert.match(index, /id="admin-panel-button"[^>]*>进入管理员控制台<\/button>/);
assert.match(index, /<dialog id="admin-dialog" class="workspace-dialog admin-dialog"/);
assert.match(index, /id="admin-refresh-users"/);
assert.match(index, /id="admin-user-list"/);
assert.match(index, /id="admin-user-detail"/);
assert.match(index, /id="admin-send-password-reset"/);
assert.match(index, /id="admin-toggle-user-suspension"/);
assert.match(index, /密码始终不可读取；需要时可向用户发送重设密码邮件/);
assert.match(styles, /\.admin-dialog/);
assert.match(styles, /\.admin-user-data/);
assert.match(styles, /\.admin-entry-card/);

assert.match(app, /const ADMIN_FUNCTION_NAME = 'admin-panel';/);
assert.match(app, /const ADMIN_EMAIL = 'rili66@outlook\.com';/);
assert.match(app, /function isAdminSessionCandidate\(session/);
assert.match(app, /elements\.adminEntryCard\.hidden = !adminCandidate/);
assert.match(app, /elements\.adminEntryStatus\.textContent/);
assert.match(app, /async function checkAdminAccess\(\{ force = false \} = \{\}\)/);
assert.match(app, /if \(!force && state\.admin\.checkedUserId === userId/);
assert.match(app, /checkAdminAccess\(\{ force: true \}\)/);
assert.match(app, /permissionError/);
assert.match(app, /function emptyAdminState\(\)/);
assert.match(app, /function renderAdminPanel\(\)/);
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
assert.match(schema, /lower\(email\) = 'rili66@outlook\.com'/);
assert.match(edge, /const ADMIN_EMAIL = 'rili66@outlook\.com';/);
assert.match(edge, /SUPABASE_SERVICE_ROLE_KEY/);
assert.match(edge, /\.from\('journal_admins'\)/);
assert.match(edge, /\.upsert\(\{ user_id: data\.user\.id \}, \{ onConflict: 'user_id', ignoreDuplicates: true \}\)/);
assert.match(edge, /\.from\('admin_audit_events'\)/);
assert.match(edge, /async function audit\(/);
assert.match(edge, /async function listUsers\(/);
assert.match(edge, /async function userData\(/);
assert.match(edge, /send_password_reset/);
assert.match(edge, /suspend_user/);
assert.match(edge, /restore_user/);
assert.match(edge, /delete config\.apiKey/);
assert.match(edge, /api_key_configured/);
assert.match(edge, /userId === actor\.id/);
assert.doesNotMatch(edge, /encrypted_password|password_hash|password\s*:/i);
assert.doesNotMatch(edge, /Access-Control-Allow-Origin': '\*'/);
assert.doesNotMatch(edge, /ADMIN_EMAIL\s*=\s*'\*'/);
assert.match(packageJson, /tests\/admin-panel-regression\.mjs/);

console.log('Administrator panel regression checks passed');
