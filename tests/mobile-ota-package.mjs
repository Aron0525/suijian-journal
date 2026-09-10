import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const runFile = promisify(execFile);
const projectRoot = fileURLToPath(new URL('../', import.meta.url));

await runFile('node', ['scripts/build-mobile-web.mjs'], { cwd: projectRoot });

const manifest = JSON.parse(await readFile(new URL('../dist-mobile/app-update.json', import.meta.url), 'utf8'));
assert.match(manifest.version, /^mobile-ota-[a-f0-9]{16}$/);
assert.equal(manifest.url, `https://933647.xyz/updates/suijian-web-${manifest.version}.zip`);
assert.match(manifest.checksum, /^[a-f0-9]{64}$/);

const zipName = new URL(manifest.url).pathname.split('/').at(-1);
const zipPath = new URL(`../dist-mobile/updates/${zipName}`, import.meta.url);
await access(zipPath);
const actualChecksum = createHash('sha256').update(await readFile(zipPath)).digest('hex');
assert.equal(actualChecksum, manifest.checksum);

const bundledIndex = await readFile(new URL('../dist-mobile/index.html', import.meta.url), 'utf8');
assert.match(bundledIndex, /connect-src 'self' https:\/\/\*\.supabase\.co https:\/\/933647\.xyz https:\/\/aron0525\.github\.io/, 'the OTA bundle must permit update checks from the Capacitor WebView origin');

const { stdout } = await runFile('unzip', ['-Z1', zipPath.pathname]);
assert.match(stdout, /^index\.html$/m);
assert.match(stdout, /^app\.js$/m);
assert.match(stdout, /^admin-export\.js$/m);
assert.doesNotMatch(stdout, /^updates\//m);

console.log(`Mobile OTA package regression checks passed: ${manifest.version}`);
