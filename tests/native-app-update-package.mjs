import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const runFile = promisify(execFile);
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const version = JSON.parse(await readFile(new URL('../mobile-version.json', import.meta.url), 'utf8'));
assert.equal(version.versionCode, 3);
assert.equal(version.versionName, '1.1.1');

const temp = await mkdtemp(join(tmpdir(), 'suijian-native-update-'));
const apkPath = join(temp, 'app-release.apk');
const outputPath = join(temp, 'site');
const apkBytes = Buffer.from('synthetic-android-installer');
await writeFile(apkPath, apkBytes);

await runFile('node', [
  'scripts/build-native-update-manifest.mjs',
  '--apk', apkPath,
  '--output', outputPath,
  '--base-url', 'https://aron0525.github.io/suijian-journal',
], { cwd: projectRoot });

const manifest = JSON.parse(await readFile(join(outputPath, 'native-app-update.json'), 'utf8'));
assert.equal(manifest.versionCode, version.versionCode);
assert.equal(manifest.versionName, version.versionName);
assert.equal(manifest.apkUrl, 'https://aron0525.github.io/suijian-journal/downloads/suijian-android-v1.1.1.apk');
assert.equal(manifest.checksum, createHash('sha256').update(apkBytes).digest('hex'));
assert.equal(await readFile(join(outputPath, 'downloads', 'suijian-android-v1.1.1.apk'), 'utf8'), apkBytes.toString());

console.log(`Native Android update package regression checks passed: v${manifest.versionName}`);
