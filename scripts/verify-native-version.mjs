import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const baseSha = process.env.BASE_SHA || 'HEAD^';
const changed = execFileSync('git', [
  'diff', '--name-only', baseSha, 'HEAD', '--',
  'android', 'ios', 'build-android-apk.sh', 'capacitor.config.ts', 'mobile-version.json',
], { encoding: 'utf8' }).trim();

if (!changed) {
  console.log('Android 原生文件未变化，无需递增版本。');
  process.exit(0);
}

const previous = JSON.parse(execFileSync('git', ['show', `${baseSha}:mobile-version.json`], { encoding: 'utf8' }));
const current = JSON.parse(await readFile(new URL('../mobile-version.json', import.meta.url), 'utf8'));
const validVersion = (value) => Number.isSafeInteger(value?.versionCode) && value.versionCode > 0
  && /^\d+\.\d+\.\d+$/.test(value?.versionName || '');

if (!validVersion(previous) || !validVersion(current)) {
  throw new Error('mobile-version.json 必须包含正整数 versionCode 与 x.y.z versionName');
}
if (current.versionCode <= previous.versionCode) {
  throw new Error(`检测到 Android 原生改动，但 versionCode 未递增：${previous.versionCode} → ${current.versionCode}`);
}
console.log(`Android 原生版本检查通过：${previous.versionCode} → ${current.versionCode}`);
