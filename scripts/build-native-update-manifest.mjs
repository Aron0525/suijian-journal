import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DEFAULT_BASE_URL = 'https://aron0525.github.io/suijian-journal';
const args = process.argv.slice(2);

function option(name, fallback = '') {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1] || fallback;
}

const apkPath = resolve(option('--apk', '岁笺-Android-v1.1.0.apk'));
const outputPath = resolve(option('--output', 'dist-mobile'));
const pagesBaseUrl = option('--base-url', DEFAULT_BASE_URL).replace(/\/$/, '');
const version = JSON.parse(await readFile(new URL('../mobile-version.json', import.meta.url), 'utf8'));
const versionCode = Number(version.versionCode);
const versionName = String(version.versionName || '');

if (!Number.isSafeInteger(versionCode) || versionCode < 1) throw new Error('mobile-version.json 的 versionCode 必须是正整数');
if (!/^\d+\.\d+\.\d+$/.test(versionName)) throw new Error('mobile-version.json 的 versionName 必须是 x.y.z');

const apkName = `suijian-android-v${versionName}.apk`;
const downloadsPath = resolve(outputPath, 'downloads');
const apkBytes = await readFile(apkPath);
await mkdir(downloadsPath, { recursive: true });
await copyFile(apkPath, resolve(downloadsPath, apkName));

const manifest = {
  versionCode,
  versionName,
  apkUrl: `${pagesBaseUrl}/downloads/${apkName}`,
  checksum: createHash('sha256').update(apkBytes).digest('hex'),
};
await writeFile(resolve(outputPath, 'native-app-update.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`native-app-update-built: v${versionName} (${versionCode})`);
