import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);
const output = new URL('../dist-mobile/', import.meta.url);
const files = ['index.html', 'index.htm', 'styles.css', 'app.js', 'sw.js', 'manifest.webmanifest', 'icon.svg'];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(files.map((file) => cp(new URL(`../${file}`, import.meta.url), new URL(file, output))));
await cp(new URL('../icons', import.meta.url), new URL('icons', output), { recursive: true });
await writeFile(join(output.pathname, '.nojekyll'), '');
console.log(`mobile-web-built: ${output.pathname}`);
