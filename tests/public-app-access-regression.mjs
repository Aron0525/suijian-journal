import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');

assert.match(app, /function redirectFilePreviewToPublishedApp\(\)/, 'file preview must have a dedicated handoff to the published app');
assert.match(app, /window\.location\.protocol\s*!==\s*'file:'/);
assert.match(app, /window\.location\.replace\(DESKTOP_APP_URL\)/, 'file preview must open the production origin that can use cloud sync');
assert.match(app, /if \(!redirectFilePreviewToPublishedApp\(\)\) \{[\s\S]*initializeCloudSync\(\);/, 'redirect must run before account/session initialization');

console.log('Published-app access regression checks passed');
