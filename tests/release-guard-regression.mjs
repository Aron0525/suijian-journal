import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [mobileVersionSource, nativeManifestBuilder, workflow, ciWorkflow, gitignore, androidManifest, readme] = await Promise.all([
  readFile(new URL('../mobile-version.json', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/build-native-update-manifest.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8'),
  readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'),
  readFile(new URL('../.gitignore', import.meta.url), 'utf8'),
  readFile(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8'),
  readFile(new URL('../README.md', import.meta.url), 'utf8'),
]);

const mobileVersion = JSON.parse(mobileVersionSource);
assert.deepEqual(mobileVersion, { versionCode: 4, versionName: '1.1.2' });

assert.match(nativeManifestBuilder, /const apkInput = option\('--apk'\);/);
assert.match(nativeManifestBuilder, /缺少 --apk 参数/);
assert.doesNotMatch(nativeManifestBuilder, /Android-v1\.1\.0\.apk/);

assert.match(workflow, /fetch-depth: 0/);
assert.match(workflow, /name: Require Android version increment/);
assert.match(workflow, /BASE_SHA="\$\(git rev-parse HEAD\^ 2>\/dev\/null \|\| true\)"/);
assert.match(workflow, /\[ "\$BASE_SHA" = '0{40}' \]/);
assert.match(workflow, /git diff --quiet "\$BASE_SHA" HEAD -- android ios build-android-apk\.sh capacitor\.config\.ts mobile-version\.json/);
assert.match(workflow, /name\.startsWith\('@capacitor\/'\) \|\| name === '@capgo\/capacitor-updater'/);
assert.match(workflow, /Android 原生依赖未变化，无需递增版本。/);
assert.match(workflow, /node --input-type=module - "\$BASE_SHA" <<'NODE'/);
assert.match(workflow, /current\.versionCode > previous\.versionCode/);
assert.match(workflow, /node tests\/release-guard-regression\.mjs/);
assert.match(ciWorkflow, /pull_request:/);
assert.match(ciWorkflow, /npm run check/);
assert.match(ciWorkflow, /npm test/);

assert.match(gitignore, /^android\/signing\.properties$/m);
assert.match(gitignore, /^signing\.properties$/m);
assert.match(gitignore, /^android\/app\/google-services\.json$/m);
assert.match(androidManifest, /android:allowBackup="false"/);
assert.match(readme, /登录会话会持续保留，直到主动退出、清除站点数据或同步服务撤销会话/);
assert.doesNotMatch(readme, /关闭浏览器或 App 后重新登录/);

console.log('Release guard regression checks passed');
