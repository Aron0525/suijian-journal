import { createSupabaseContext } from 'jsr:@supabase/server@^1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_BODY_BYTES = 512_000;
const CHAT_COMPLETIONS_PATH = '/chat/completions';
const MODEL_REQUEST_TIMEOUT_MS = 75_000;
const AI_API_STYLE_OPENAI_COMPATIBLE = 'openai-compatible';
const AI_API_STYLE_AZURE_OPENAI = 'azure-openai';
const DEFAULT_ALLOWED_AI_HOSTS = [
  'api.deepseek.com',
  'api.openai.com',
  'dashscope.aliyuncs.com',
  'api.moonshot.cn',
  'api.moonshot.ai',
  'api.minimax.io',
  'api.z.ai',
];

function allowedAiHosts() {
  const configured = Deno.env.get('AI_ALLOWED_HOSTS') || '';
  return new Set([
    ...DEFAULT_ALLOWED_AI_HOSTS,
    ...configured.split(',').map((host) => host.trim().toLowerCase()).filter(Boolean),
  ]);
}

function isAllowedAiHost(hostname: string) {
  const host = hostname.toLowerCase();
  return allowedAiHosts().has(host) || host.endsWith('.openai.azure.com') || host.endsWith('.maas.aliyuncs.com');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function normalizeChatEndpoint(rawEndpoint: string) {
  const url = new URL(rawEndpoint.trim());
  const path = url.pathname.replace(/\/$/, '');
  url.pathname = path.endsWith(CHAT_COMPLETIONS_PATH)
    ? path
    : `${path || ''}${CHAT_COMPLETIONS_PATH}`;
  return url.toString();
}

export default {
  fetch: async (request: Request) => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== 'POST') return json({ error: { message: '仅支持 POST 请求' } }, 405);

    const { error: authError } = await createSupabaseContext(request, { auth: 'user' });
    if (authError) return json({ error: { message: '请先登录同步账号' } }, authError.status || 401);

    const requestText = await request.text();
    if (!requestText || new TextEncoder().encode(requestText).byteLength > MAX_BODY_BYTES) {
      return json({ error: { message: '请求内容大小不符合要求' } }, 413);
    }

    try {
      const payload = JSON.parse(requestText);
      const endpoint = normalizeChatEndpoint(payload?.config?.endpoint || '');
      const model = String(payload?.config?.model || '').trim();
      const apiKey = String(payload?.config?.apiKey || '').trim();
      const apiStyle = String(payload?.config?.apiStyle || AI_API_STYLE_OPENAI_COMPATIBLE).trim();
      const system = String(payload?.system || '').trim();
      const prompt = String(payload?.prompt || '').trim();
      const parsed = new URL(endpoint);

      if (parsed.protocol !== 'https:' || !isAllowedAiHost(parsed.hostname) || ![AI_API_STYLE_OPENAI_COMPATIBLE, AI_API_STYLE_AZURE_OPENAI].includes(apiStyle) || !model || !apiKey || !system || !prompt) {
        return json({ error: { message: '请检查 API 地址、模型名称、Key 和请求内容' } }, 400);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), MODEL_REQUEST_TIMEOUT_MS);
      const upstream = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(apiStyle === 'azure-openai' ? { 'api-key': apiKey } : { Authorization: `Bearer ${apiKey}` }),
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
        }),
      }).finally(() => clearTimeout(timeout));
      const responseBody = await upstream.text();
      return new Response(responseBody, {
        status: upstream.status,
        headers: { ...corsHeaders, 'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8' },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 代理请求失败';
      return json({ error: { message } }, 400);
    }
  },
};
