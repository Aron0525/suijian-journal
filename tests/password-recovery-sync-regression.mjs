import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [index, indexHtm, app] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('index.htm', root), 'utf8'),
  readFile(new URL('app.js', root), 'utf8'),
]);

assert.equal(indexHtm, index, 'password recovery UI must remain identical in both entry pages');
assert.match(index, /<button id="sync-reset-password" type="button" class="quiet-button">重设密码<\/button>/);
assert.match(index, /<form id="sync-password-recovery-form" class="sync-password-recovery-form" hidden>/);
assert.match(index, /id="sync-new-password" type="password" required minlength="8"/);
assert.match(index, /id="sync-confirm-password" type="password" required minlength="8"/);
assert.match(index, /id="sync-update-password" type="button" class="primary-button">保存新密码<\/button>/);
assert.match(app, /passwordRecovery:\s*false/);
assert.match(app, /syncResetPassword:\s*document\.querySelector\('#sync-reset-password'\)/);
assert.match(app, /syncPasswordRecoveryForm:\s*document\.querySelector\('#sync-password-recovery-form'\)/);
assert.match(app, /async function requestCloudPasswordReset\(\)/);
assert.match(app, /cloudAuthRequest\('\/auth\/v1\/recover'/);
assert.match(app, /async function updateCloudPassword\(\)/);
assert.match(app, /method:\s*'PUT'[\s\S]*cloudUrl\('\/auth\/v1\/user'\)/);
assert.match(app, /params\.get\('type'\) === 'recovery'/);
assert.match(app, /elements\.syncResetPassword\.addEventListener\('click', requestCloudPasswordReset\)/);
assert.match(app, /elements\.syncUpdatePassword\.addEventListener\('click', updateCloudPassword\)/);

console.log('Password recovery and sync access regression checks passed');
