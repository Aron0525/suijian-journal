import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [mobileVersionSource, nativeManifestBuilder, nativeVersionGuard, serverDeployScript, ciWorkflow, gitignore, androidManifest, readme] = await Promise.all([
  readFile(new URL('../mobile-version.json', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/build-native-update-manifest.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/verify-native-version.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/deploy-server.sh', import.meta.url), 'utf8'),
  readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'),
  readFile(new URL('../.gitignore', import.meta.url), 'utf8'),
  readFile(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8'),
  readFile(new URL('../README.md', import.meta.url), 'utf8'),
]);

const mobileVersion = JSON.parse(mobileVersionSource);
assert.deepEqual(mobileVersion, { versionCode: 8, versionName: '1.1.6' });

assert.match(nativeManifestBuilder, /const apkInput = option\('--apk'\);/);
assert.match(nativeManifestBuilder, /缺少 --apk 参数/);
assert.doesNotMatch(nativeManifestBuilder, /Android-v1\.1\.0\.apk/);
assert.match(nativeVersionGuard, /Android 原生文件未变化，无需递增版本。/);
assert.match(nativeVersionGuard, /mobile-version\.json/);
assert.match(nativeVersionGuard, /current\.versionCode <= previous\.versionCode/);

assert.match(serverDeployScript, /git diff --quiet/);
assert.match(serverDeployScript, /npm run check/);
assert.match(serverDeployScript, /npm test/);
assert.match(serverDeployScript, /npm run check:native-version/);
assert.match(serverDeployScript, /npm run build:android/);
assert.match(serverDeployScript, /rsync -az --delete --delay-updates/);
assert.match(serverDeployScript, /mv -Tf/);
assert.match(serverDeployScript, /curl --fail/);
assert.match(serverDeployScript, /git push origin main/);
assert.doesNotMatch(serverDeployScript, /deploy-pages|upload-pages-artifact/);
assert.match(ciWorkflow, /pull_request:/);
assert.match(ciWorkflow, /actions\/checkout@v7/);
assert.match(ciWorkflow, /actions\/setup-node@v7/);
assert.match(ciWorkflow, /npm run check/);
assert.match(ciWorkflow, /npm test/);

assert.match(gitignore, /^android\/signing\.properties$/m);
assert.match(gitignore, /^signing\.properties$/m);
assert.match(gitignore, /^android\/app\/google-services\.json$/m);
assert.match(androidManifest, /android:allowBackup="false"/);
assert.match(readme, /登录会话会持续保留，直到主动退出、清除站点数据或同步服务撤销会话/);
assert.doesNotMatch(readme, /关闭浏览器或 App 后重新登录/);

console.log('Release guard regression checks passed');
