import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const runFile = promisify(execFile);
const output = new URL('../dist-mobile/', import.meta.url);
const outputPath = fileURLToPath(output);
const files = ['index.html', 'index.htm', 'styles.css', 'app.js', 'sw.js', 'manifest.webmanifest', 'icon.svg'];
const pagesBaseUrl = 'https://aron0525.github.io/suijian-journal';

async function listBundleFiles(directory, prefix = '') {
  const names = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(names
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(async (entry) => {
      const relative = `${prefix}${entry.name}`;
      if (entry.isDirectory()) return listBundleFiles(new URL(`${entry.name}/`, directory), `${relative}/`);
      return [relative];
    }));
  return nested.flat();
}

async function bundleRelease() {
  const hash = createHash('sha256');
  const bundleFiles = await listBundleFiles(output);
  for (const file of bundleFiles) {
    hash.update(file);
    hash.update(await readFile(new URL(file, output)));
  }
  return `mobile-ota-${hash.digest('hex').slice(0, 16)}`;
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(files.map((file) => cp(new URL(`../${file}`, import.meta.url), new URL(file, output))));
await cp(new URL('../icons', import.meta.url), new URL('icons', output), { recursive: true });
await writeFile(new URL('.nojekyll', output), '');

const release = await bundleRelease();
const updatesPath = new URL('updates/', output);
const zipName = `suijian-web-${release}.zip`;
const zipPath = fileURLToPath(new URL(zipName, updatesPath));
await mkdir(updatesPath, { recursive: true });
await runFile('zip', ['-qr', zipPath, ...files, 'icons', '.nojekyll'], { cwd: outputPath });
const checksum = createHash('sha256').update(await readFile(zipPath)).digest('hex');
const manifest = {
  version: release,
  url: `${pagesBaseUrl}/updates/${zipName}`,
  checksum,
};
await writeFile(new URL('app-update.json', output), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`mobile-web-built: ${outputPath}`);
console.log(`mobile-ota-built: ${manifest.version}`);
