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

// 接口类型固定为三类；OpenAI-compatible 下提供平台地址与模型预设。
assert.match(index, /id="ai-interface-type"/);
for (const type of ['deepseek', 'openai', 'openai-compatible']) {
  assert.match(index, new RegExp(`value="${type}"`));
}
assert.match(index, /id="ai-platform-preset"/);
for (const preset of ['openai-compatible', 'qwen', 'kimi', 'minimax', 'glm']) {
  assert.match(app, new RegExp(`['"]${preset}['"]`));
}
assert.match(index, /id="ai-model"[^>]*list="ai-model-options"/);
assert.match(index, /<datalist id="ai-model-options"><\/datalist>/);
assert.match(app, /function aiInterfaceTypeForProvider\(provider\)/);
assert.match(app, /function renderAiPlatformOptions\(interfaceType/);
assert.match(app, /function renderAiModelOptions\(provider/);
assert.match(app, /function selectedAiProvider\(\)/);
assert.match(app, /const AI_PROVIDER_PRESETS/);
assert.match(app, /apiStyle/);
assert.match(index, /id="open-organize-prompt-settings"/);
assert.match(index, /id="open-summary-prompt-settings"/);
assert.doesNotMatch(index, /id="ai-organize-prompt"/);
assert.doesNotMatch(index, /id="ai-summary-prompt"/);

// Azure OpenAI 使用 api-key header；其余 OpenAI-compatible provider 使用 Bearer header。
assert.match(edge, /apiStyle === 'azure-openai'/);
assert.match(edge, /'api-key': apiKey/);
assert.match(edge, /Authorization: `Bearer \$\{apiKey\}`/);

console.log('Model configuration regression checks passed');
