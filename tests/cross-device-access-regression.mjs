import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [index, indexHtm, app, styles, builder, packageJson] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('index.htm', root), 'utf8'),
  readFile(new URL('app.js', root), 'utf8'),
  readFile(new URL('styles.css', root), 'utf8'),
  readFile(new URL('scripts/build-native-update-manifest.mjs', root), 'utf8'),
  readFile(new URL('package.json', root), 'utf8'),
]);

assert.equal(indexHtm, index, 'both entry documents must offer the same cross-device access controls');
assert.match(index, /id="android-app-card"/);
assert.match(index, /id="android-app-url"[^>]*href="https:\/\/933647\.xyz\/downloads\/suijian-android-latest\.apk"/);
assert.match(index, /id="copy-android-app-url"/);
assert.match(index, /id="desktop-app-card"/);
assert.match(index, /id="desktop-app-url"[^>]*href="https:\/\/933647\.xyz\/"/);
assert.match(index, /id="copy-desktop-app-url"/);
assert.match(app, /const ANDROID_APP_DOWNLOAD_URL = 'https:\/\/933647\.xyz\/downloads\/suijian-android-latest\.apk';/);
assert.match(app, /function renderCrossDeviceAccess\(\)/);
assert.match(app, /elements\.androidAppCard\.hidden = mobileExperience/);
assert.match(app, /elements\.desktopAppCard\.hidden = !mobileExperience/);
assert.match(app, /function copyAndroidAppUrl\(\)/);
assert.match(app, /elements\.copyAndroidAppUrl\.addEventListener\('click', copyAndroidAppUrl\)/);
assert.match(app, /window\.addEventListener\('resize', \(\) => renderCrossDeviceAccess\(\)\)/);
assert.match(styles, /\.cross-device-card/);
assert.match(builder, /const latestApkName = 'suijian-android-latest\.apk';/);
assert.match(builder, /copyFile\(apkPath, resolve\(downloadsPath, latestApkName\)\)/);
assert.match(packageJson, /tests\/cross-device-access-regression\.mjs/);

console.log('Cross-device access regression checks passed');
