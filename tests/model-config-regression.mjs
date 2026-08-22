import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, index, indexHtm, edge] = await Promise.all([
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../index.htm', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/functions/ai-proxy/index.ts', import.meta.url), 'utf8'),
]);

assert.equal(indexHtm, index, '两份 PWA 入口必须一致');

// 登录应一直保留到用户主动退出或服务端撤销会话，而不是前端按天数清除。
assert.doesNotMatch(app, /SESSION_REMEMBER_MS|session\.rememberUntil|rememberUntil <= Date\.now/);
assert.match(app, /Legacy sessions included a local expiry/);
const refreshSessionSource = app.match(/async function refreshCloudSession\(\) \{[\s\S]+?\n\}/)?.[0] ?? '';
assert.match(refreshSessionSource, /error\?\.status/);
assert.match(refreshSessionSource, /storeCloudSession\(null\)/);

// 配置选择器既支持通用协议，也提供常用平台的可直接套用预设。
assert.match(index, /id="ai-provider-preset"/);
assert.match(index, /<span id="ai-model-label">模型名称<\/span><input id="ai-model"/);
for (const preset of ['deepseek', 'openai-compatible', 'azure-openai', 'qwen', 'kimi', 'minimax', 'glm']) {
  assert.match(index, new RegExp(`value="${preset}"`));
  assert.match(app, new RegExp(`['"]${preset}['"]`));
}
assert.match(app, /const AI_PROVIDER_PRESETS/);
assert.match(app, /apiStyle/);
assert.match(index, /id="open-organize-prompt-settings"/);
assert.match(index, /id="open-summary-prompt-settings"/);
assert.doesNotMatch(index, /id="ai-organize-prompt"/);
assert.doesNotMatch(index, /id="ai-summary-prompt"/);

// 同步操作保持直接同步，但在模型配置和账号之间以图标文字按钮呈现。
const topTools = index.match(/<div class="top-tools">([\s\S]+?)<\/div>/)?.[1] ?? '';
assert.match(topTools, /model-config-button[\s\S]*cloud-sync-button[\s\S]*cloud-account-button/);
assert.match(topTools, /id="cloud-sync-button"[^>]*>[\s\S]*?<svg[\s\S]*?<span>同步<\/span>/);

// Azure OpenAI 使用 api-key header；其余 OpenAI-compatible provider 使用 Bearer header。
assert.match(edge, /apiStyle === 'azure-openai'/);
assert.match(edge, /'api-key': apiKey/);
assert.match(edge, /Authorization: `Bearer \$\{apiKey\}`/);

console.log('Model configuration regression checks passed');
