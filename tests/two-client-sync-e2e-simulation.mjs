import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, resolve, sep } from 'node:path';
import { once } from 'node:events';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = resolve(new URL('..', import.meta.url).pathname);
const failureMode = process.env.SYNC_E2E_FAILURE_MODE !== 'none';
const userId = '11111111-1111-4111-8111-111111111111';
const session = {
  accessToken: 'simulated-access-token',
  refreshToken: 'simulated-refresh-token',
  user: { id: userId, email: 'sync-simulation@example.test' },
  expiresAt: Date.now() + 60 * 60 * 1000,
};
const database = {
  entries: new Map(),
  drafts: new Map(),
  summaries: new Map(),
  periods: new Map(),
  tasks: new Map(),
  aiSettings: new Map(),
  backups: new Map(),
  requests: [],
  failAiSettings: failureMode,
  failPeriodSummaries: failureMode,
  missingDraftsTable: failureMode,
};

function json(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function noContent(response) {
  response.writeHead(204);
  response.end();
}

async function body(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : null;
}

function recordsFor(table, id = userId) {
  return [...table.values()].filter((record) => record.user_id === id);
}

function draftKey(record) {
  return `${record.user_id}:${record.draft_date}`;
}

function summaryKey(record) {
  return `${record.user_id}:${record.entry_date}`;
}

function backupKey(record) {
  return `${record.user_id}:${record.backup_date}`;
}

function periodKey(record) {
  return record.id;
}

function taskKey(record) {
  return record.id;
}

function upsert(table, records, key) {
  records.forEach((record) => table.set(key(record), structuredClone(record)));
  return records.map((record) => structuredClone(table.get(key(record))));
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

async function serveStatic(request, response, pathname) {
  if (pathname === '/favicon.ico') return noContent(response);
  const relative = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.replace(/^\/+/, ''));
  const file = resolve(root, relative);
  if (!file.startsWith(`${root}${sep}`) && file !== root) return json(response, 403, { error: 'forbidden' });
  try {
    const info = await stat(file);
    if (!info.isFile()) return json(response, 404, { error: 'not found' });
    response.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    response.end(await readFile(file));
  } catch {
    json(response, 404, { error: 'not found' });
  }
}

async function handleRest(request, response, url) {
  if (request.headers.authorization !== `Bearer ${session.accessToken}`) return json(response, 401, { message: 'invalid simulated session' });
  const table = url.pathname.split('/').at(-1);
  database.requests.push({ method: request.method, table });
  if (table === 'ai_settings' && database.failAiSettings) {
    return json(response, 503, { message: 'simulated optional AI settings outage' });
  }
  if (table === 'period_summaries' && database.failPeriodSummaries) {
    return json(response, 503, { message: 'simulated optional period summaries outage' });
  }
  if (table === 'journal_drafts' && database.missingDraftsTable) {
    return json(response, 404, { code: 'PGRST205', message: "Could not find the table 'public.journal_drafts' in the schema cache" });
  }
  const get = (records) => json(response, 200, records.map((record) => structuredClone(record)));

  if (request.method === 'GET') {
    if (table === 'journal_entries') return get(recordsFor(database.entries));
    if (table === 'journal_drafts') return get(recordsFor(database.drafts));
    if (table === 'daily_summaries') return get(recordsFor(database.summaries));
    if (table === 'period_summaries') return get(recordsFor(database.periods));
    if (table === 'journal_tasks') return get(recordsFor(database.tasks));
    if (table === 'ai_settings') return get(recordsFor(database.aiSettings));
    if (table === 'journal_backups') return get(recordsFor(database.backups));
    return json(response, 404, { message: `unknown simulated table: ${table}` });
  }

  if (request.method === 'DELETE') {
    if (table === 'journal_backups') return noContent(response);
    return json(response, 404, { message: `unknown simulated table: ${table}` });
  }

  if (request.method !== 'POST') return json(response, 405, { message: 'method not allowed' });
  const payload = await body(request);
  const records = Array.isArray(payload) ? payload : [payload];
  const maps = {
    journal_entries: [database.entries, (record) => record.id],
    journal_drafts: [database.drafts, draftKey],
    daily_summaries: [database.summaries, summaryKey],
    period_summaries: [database.periods, periodKey],
    journal_tasks: [database.tasks, taskKey],
    ai_settings: [database.aiSettings, (record) => record.user_id],
    journal_backups: [database.backups, backupKey],
  };
  const config = maps[table];
  if (!config) return json(response, 404, { message: `unknown simulated table: ${table}` });
  return json(response, 201, upsert(config[0], records, config[1]));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  try {
    if (url.pathname.startsWith('/api/rest/v1/')) return await handleRest(request, response, url);
    if (url.pathname.startsWith('/api/auth/')) return json(response, 200, {});
    return await serveStatic(request, response, url.pathname);
  } catch (error) {
    return json(response, 500, { message: error instanceof Error ? error.message : 'simulated server failure' });
  }
});

async function waitFor(predicate, label, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  assert.fail(`Timed out waiting for ${label}`);
}

async function seedClient(context, apiUrl) {
  await context.addInitScript(({ cloudConfig, cloudSession }) => {
    localStorage.setItem('suijian-supabase-config-v1', JSON.stringify(cloudConfig));
    localStorage.setItem('suijian-supabase-session-v1', JSON.stringify(cloudSession));
  }, { cloudConfig: { url: apiUrl, publishableKey: 'simulated-publishable-key' }, cloudSession: session });
}

await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const port = server.address().port;
const site = `http://127.0.0.1:${port}`;
const apiUrl = `${site}/api`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const consoleErrors = [];
const pageErrors = [];
let desktop;
let mobile;

try {
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36',
    isMobile: true,
  });
  await Promise.all([seedClient(desktopContext, apiUrl), seedClient(mobileContext, apiUrl)]);
  desktop = await desktopContext.newPage();
  mobile = await mobileContext.newPage();
  [desktop, mobile].forEach((page) => {
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
  });

  await desktop.goto(site, { waitUntil: 'networkidle' });
  await desktop.locator('#entry-content').waitFor({ state: 'visible' });
  const desktopMarker = `SIM_DESKTOP_TO_MOBILE_${Date.now()}`;
  await desktop.locator('#entry-title').fill(desktopMarker);
  await desktop.locator('#entry-content').fill('合成电脑端同步验证内容');
  await desktop.locator('#save-entry').click();
  await waitFor(() => [...database.entries.values()].some((entry) => entry.title === desktopMarker), 'desktop entry upload');

  await mobile.goto(site, { waitUntil: 'networkidle' });
  await mobile.locator('#entry-content').waitFor({ state: 'visible' });
  await mobile.locator('body').waitFor({ state: 'visible' });
  await waitFor(async () => (await mobile.locator('body').innerText()).includes(desktopMarker), 'desktop entry arriving on mobile');

  const mobileMarker = `SIM_MOBILE_TO_DESKTOP_${Date.now()}`;
  await mobile.locator('#entry-title').fill(mobileMarker);
  await mobile.locator('#entry-content').fill('合成手机端同步验证内容');
  await mobile.locator('#save-entry').click();
  await waitFor(() => [...database.entries.values()].some((entry) => entry.title === mobileMarker), 'mobile entry upload');

  await desktop.locator('#cloud-sync-button').click();
  await waitFor(async () => (await desktop.locator('body').innerText()).includes(mobileMarker), 'mobile entry arriving on desktop');

  const liveEntries = [...database.entries.values()].filter((entry) => !entry.deleted_at);
  assert.equal(liveEntries.length, 2, 'each simulated device should create exactly one shared journal entry');
  assert(liveEntries.every((entry) => entry.user_id === userId), 'both uploads must stay scoped to the same signed-in account');
  assert.equal(new Set(liveEntries.map((entry) => entry.id)).size, 2, 'incremental sync must not duplicate entries');
  if (failureMode) {
    assert(database.requests.some((item) => item.table === 'ai_settings'), 'the AI settings outage must be exercised');
    assert(database.requests.some((item) => item.table === 'period_summaries'), 'the period summary outage must be exercised');
    assert(database.requests.some((item) => item.table === 'journal_drafts'), 'the production-compatible missing drafts table path must be exercised');
  }
  assert.equal(pageErrors.length, 0, `browser runtime errors: ${pageErrors.join(' | ')}`);

  console.log(`Two-client sync E2E simulation passed (${failureMode ? 'auxiliary outage' : 'healthy cloud'}): desktop→mobile and mobile→desktop (${liveEntries.length} shared entries)`);
} catch (error) {
  const bodyText = async (page) => page ? (await page.locator('body').innerText().catch(() => '')).slice(0, 5000) : '';
  console.error(JSON.stringify({
    phase: 'two-client-sync-e2e',
    error: error instanceof Error ? error.message : String(error),
    requests: database.requests,
    entries: [...database.entries.values()],
    consoleErrors,
    pageErrors,
    desktopBody: await bodyText(desktop),
    mobileBody: await bodyText(mobile),
  }, null, 2));
  throw error;
} finally {
  await browser.close();
  await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
}
