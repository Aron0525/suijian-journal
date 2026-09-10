import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [deploy, bootstrap, rollback, caddyfile, example, gitignore, packageJson, ci] = await Promise.all([
  readFile(new URL('scripts/deploy-server.sh', root), 'utf8'),
  readFile(new URL('scripts/bootstrap-server.sh', root), 'utf8'),
  readFile(new URL('scripts/rollback-server.sh', root), 'utf8'),
  readFile(new URL('deploy/Caddyfile', root), 'utf8'),
  readFile(new URL('deploy/server.env.example', root), 'utf8'),
  readFile(new URL('.gitignore', root), 'utf8'),
  readFile(new URL('package.json', root), 'utf8'),
  readFile(new URL('.github/workflows/ci.yml', root), 'utf8'),
]);

await assert.rejects(access(new URL('.github/workflows/deploy-pages.yml', root)));
assert.match(deploy, /npm run build:android/);
assert.match(deploy, /npm run check:native-version/);
assert.match(deploy, /rsync -az --delete --delay-updates/);
assert.match(deploy, /native-app-update\.json/);
assert.match(deploy, /git push origin main/);
assert.match(bootstrap, /caddy validate/);
assert.match(rollback, /mv -Tf/);
assert.match(caddyfile, /root \* \/srv\/suijian\/site/);
assert.match(caddyfile, /app-update\.json/);
assert.match(example, /DEPLOY_HOST/);
assert.match(gitignore, /deploy\/server\.env/);
assert.match(packageJson, /"deploy:server"/);
assert.match(packageJson, /"check:native-version"/);
assert.match(packageJson, /tests\/server-deployment-regression\.mjs/);
assert.match(ci, /branches: \[main\]/);

console.log('Server deployment regression checks passed');
