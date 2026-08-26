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

// 默认 AI 整理要把口语和碎片记录转为清晰书面日记；默认汇总只提炼行动与想法，避免反思式输出。
const defaultOrganizePrompt = app.match(/const DEFAULT_ORGANIZE_PROMPT = `([\s\S]*?)`;/)?.[1] ?? '';
const defaultSummaryPrompt = app.match(/const DEFAULT_SUMMARY_PROMPT = `([\s\S]*?)`;/)?.[1] ?? '';
assert.match(defaultOrganizePrompt, /你只负责改善表达，不重写经历/);
assert.match(defaultOrganizePrompt, /只要不能确定，就保留原有说法/);
assert.match(defaultOrganizePrompt, /不要添加标题、清单、反思、总结、计划、评价或原文没有的内容/);
assert.match(defaultOrganizePrompt, /原始：今天开会说产品里导入那里要改/);
assert.doesNotMatch(defaultOrganizePrompt, /【待确认：……】/);
assert.match(defaultSummaryPrompt, /只说明“我做了什么”和“我想了什么”/);
assert.match(defaultSummaryPrompt, /必须区分“已完成、进行中、计划”/);
assert.match(defaultSummaryPrompt, /【4月2日】下午处理导入功能/);
assert.match(defaultSummaryPrompt, /做了什么：/);
assert.match(defaultSummaryPrompt, /想了什么：/);
assert.doesNotMatch(defaultSummaryPrompt, /关键词：/);
assert.match(defaultSummaryPrompt, /指代不明、信息不足或前后矛盾的内容不写入总结/);
assert.doesNotMatch(defaultSummaryPrompt, /【待确认：……】/);

// 旧的内置默认文本在升级后应自动切换为新默认；用户自己编辑过的提示词仍保留。
assert.match(app, /const PREVIOUS_DEFAULT_ORGANIZE_PROMPT = `/);
assert.match(app, /const PREVIOUS_DEFAULT_SUMMARY_PROMPT = `/);
assert.match(app, /const PREVIOUS_REFINED_ORGANIZE_PROMPT = `/);
assert.match(app, /const PREVIOUS_REFINED_SUMMARY_PROMPT = `/);
assert.match(app, /const PREVIOUS_CURRENT_ORGANIZE_PROMPT = `/);
assert.match(app, /const PREVIOUS_CURRENT_SUMMARY_PROMPT = `/);
assert.match(app, /LEGACY_ORGANIZE_PROMPTS = new Set\(\[[\s\S]*PREVIOUS_CURRENT_ORGANIZE_PROMPT[\s\S]*PREVIOUS_REFINED_ORGANIZE_PROMPT[\s\S]*PREVIOUS_DEFAULT_ORGANIZE_PROMPT/s);
assert.match(app, /LEGACY_SUMMARY_PROMPTS = new Set\(\[[\s\S]*PREVIOUS_CURRENT_SUMMARY_PROMPT[\s\S]*PREVIOUS_REFINED_SUMMARY_PROMPT[\s\S]*PREVIOUS_DEFAULT_SUMMARY_PROMPT/s);

// Azure OpenAI 使用 api-key header；其余 OpenAI-compatible provider 使用 Bearer header。
assert.match(edge, /apiStyle === 'azure-openai'/);
assert.match(edge, /'api-key': apiKey/);
assert.match(edge, /Authorization: `Bearer \$\{apiKey\}`/);

console.log('Model configuration regression checks passed');
