import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');

assert.match(app, /async function fetchUpdateManifest\(urls, label\)/, 'both OTA and installer manifests need a fallback fetch path');
assert.match(app, /state\.nativeInstaller\.installed = await installedNativeAppInfo\(\);[\s\S]*fetchUpdateManifest\(NATIVE_APP_UPDATE_MANIFEST_URLS/, 'installed version must be saved before a manifest request can fail');
assert.doesNotMatch(app, /const \[installed, response\] = await Promise\.all\(\[[\s\S]*installedNativeAppInfo/, 'a failed manifest must not discard an already-read native version');
assert.match(app, /state\.nativeInstaller\.status = `安装包更新检查失败：\$\{message\}`/);
assert.match(app, /state\.nativeUpdate\.status = `网页内容更新检查失败：\$\{message\}`/);
assert.match(app, /elements\.mobileAppUpdateStatus\.textContent = checking[\s\S]*state\.nativeUpdate\.status/, 'manual update errors must be visible in the mobile panel');

console.log('Native update recovery regression checks passed');
