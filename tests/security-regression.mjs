import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, serviceWorker, edgeFunction, githubPagesWorkflow, manifest] = await Promise.all([
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../sw.js', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/functions/ai-proxy/index.ts', import.meta.url), 'utf8'),
  readFile(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8'),
  readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'),
]);

assert.match(app, /sessionStorage\.setItem\(CLOUD_SESSION_KEY/);
assert.match(app, /sessionStorage\.removeItem\(CLOUD_SESSION_KEY/);
assert.doesNotMatch(app, /localStorage\.setItem\(CLOUD_SESSION_KEY/);
assert.match(app, /email_redirect_to: emailRedirectUrl\(\)/);
assert.match(app, /function validateCloudCredentials\(\)/);
assert.match(app, /const \{ apiKey: legacyApiKey, \.\.\.safeConfig \} = config/);
assert.match(app, /账号已切换，等待确认/);
assert.match(app, /cloudAccountButton/);
assert.match(app, /function recordCloudActivity\(message/);
assert.match(app, /persistDataChange/);
assert.doesNotMatch(serviceWorker, /caches\.match\(event\.request\)/);
assert.match(serviceWorker, /if \(url\.origin !== self\.location\.origin\) return/);
assert.match(edgeFunction, /parsed\.protocol !== 'https:'/);
assert.match(edgeFunction, /allowedAiHosts\(\)\.has/);
assert.match(githubPagesWorkflow, /actions\/upload-pages-artifact@v3/);
assert.match(githubPagesWorkflow, /path: dist-mobile/);
assert.match(githubPagesWorkflow, /actions\/deploy-pages@v4/);
assert.match(manifest, /"start_url": "\.\/index\.htm"/);
assert.match(manifest, /"scope": "\.\/"/);

console.log('JavaScript security regression checks passed');
