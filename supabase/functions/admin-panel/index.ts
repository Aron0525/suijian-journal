import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

const APP_ORIGIN = 'https://aron0525.github.io';
const APP_PATH = '/suijian-journal';
const APP_URL = `${APP_ORIGIN}${APP_PATH}/`;
const ADMIN_EMAIL = 'rili66@outlook.com';
const ALLOWED_ORIGINS = new Set([APP_ORIGIN, 'capacitor://localhost', 'http://localhost', 'http://127.0.0.1:4173']);
const USER_PAGE_SIZE = 100;
const MAX_USER_PAGE = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{3}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : APP_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`缺少服务端环境变量 ${name}`);
  return value;
}

function serviceClient() {
  return createClient(
    requiredEnv('SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function currentAdmin(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) throw Object.assign(new Error('请先登录管理员账号'), { status: 401 });
  const userClient = createClient(
    requiredEnv('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY') || requiredEnv('SUPABASE_PUBLISHABLE_KEY'),
    { global: { headers: { Authorization: authorization } }, auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) throw Object.assign(new Error('登录会话已失效，请重新登录'), { status: 401 });
  if ((data.user.email || '').trim().toLowerCase() !== ADMIN_EMAIL) {
    throw Object.assign(new Error('当前账号没有管理员权限'), { status: 403 });
  }

  const admin = serviceClient();
  const { data: allowed, error: allowedError } = await admin
    .from('journal_admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();
  if (allowedError) throw Object.assign(new Error('管理员权限尚未初始化，请先执行数据库迁移'), { status: 503 });
  if (!allowed) throw Object.assign(new Error('当前账号没有管理员权限'), { status: 403 });
  return { admin, actor: data.user };
}

async function audit(admin: SupabaseClient, actor: User, action: string, targetUserId: string | null = null, detail: Record<string, unknown> = {}) {
  const { error } = await admin.from('admin_audit_events').insert({
    actor_user_id: actor.id,
    action,
    target_user_id: targetUserId,
    detail,
  });
  if (error) throw Object.assign(new Error('管理员审计记录写入失败'), { status: 503 });
}

function safeAiSettings(record: Record<string, unknown> | null) {
  const config = record?.config && typeof record.config === 'object' && !Array.isArray(record.config)
    ? { ...(record.config as Record<string, unknown>) }
    : {};
  delete config.apiKey;
  return record ? { ...record, config, api_key_configured: Boolean((record.config as Record<string, unknown>)?.apiKey) } : null;
}

async function listUsers(request: Request, admin: SupabaseClient, actor: User, page: number) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: USER_PAGE_SIZE });
  if (error) throw error;
  await audit(admin, actor, 'list_users', null, { page });
  return json(request, {
    users: data.users.map((user) => ({
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at || null,
      email_confirmed_at: user.email_confirmed_at || null,
      banned_until: user.banned_until || null,
    })),
    next_page: data.nextPage || null,
  });
}

async function userData(request: Request, admin: SupabaseClient, actor: User, userId: string) {
  if (!UUID.test(userId)) throw Object.assign(new Error('用户标识无效'), { status: 400 });
  const [userResult, entriesResult, dailyResult, periodResult, taskResult, backupResult, aiResult] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from('journal_entries').select('id,entry_date,title,content,original_content,attachments,created_at,updated_at,deleted_at').eq('user_id', userId).order('updated_at', { ascending: false }),
    admin.from('daily_summaries').select('id,entry_date,content,model,created_at,updated_at,deleted_at').eq('user_id', userId).order('updated_at', { ascending: false }),
    admin.from('period_summaries').select('id,start_date,end_date,entry_ids,content,model,created_at,updated_at,deleted_at').eq('user_id', userId).order('updated_at', { ascending: false }),
    admin.from('journal_tasks').select('id,entry_id,source_key,content,completed,created_at,updated_at,deleted_at').eq('user_id', userId).order('updated_at', { ascending: false }),
    admin.from('journal_backups').select('id,backup_date,payload,created_at').eq('user_id', userId).order('backup_date', { ascending: false }),
    admin.from('ai_settings').select('config,created_at,updated_at').eq('user_id', userId).maybeSingle(),
  ]);
  const errors = [userResult.error, entriesResult.error, dailyResult.error, periodResult.error, taskResult.error, backupResult.error, aiResult.error].filter(Boolean);
  if (errors.length) throw errors[0];

  const attachments = await admin.storage.from('journal-attachments').list(userId, { limit: 1000 }).catch(() => ({ data: [] }));
  await audit(admin, actor, 'view_user_data', userId, { entry_count: entriesResult.data?.length || 0 });
  return json(request, {
    user: {
      id: userResult.data.user.id,
      email: userResult.data.user.email || '',
      created_at: userResult.data.user.created_at,
      last_sign_in_at: userResult.data.user.last_sign_in_at || null,
      email_confirmed_at: userResult.data.user.email_confirmed_at || null,
      banned_until: userResult.data.user.banned_until || null,
    },
    data: {
      entries: entriesResult.data || [],
      daily_summaries: dailyResult.data || [],
      period_summaries: periodResult.data || [],
      tasks: taskResult.data || [],
      backups: backupResult.data || [],
      ai_settings: safeAiSettings(aiResult.data),
      attachment_folders: attachments.data || [],
    },
  });
}

async function changeUserState(request: Request, admin: SupabaseClient, actor: User, action: string, payload: Record<string, unknown>) {
  const userId = String(payload.user_id || '');
  if (!UUID.test(userId)) throw Object.assign(new Error('用户标识无效'), { status: 400 });
  if (userId === actor.id) throw Object.assign(new Error('管理员账号不可在此处停用'), { status: 400 });
  if (action === 'suspend_user' || action === 'restore_user') {
    const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: action === 'suspend_user' ? '876000h' : 'none' });
    if (error) throw error;
    await audit(admin, actor, action, userId);
    return json(request, { ok: true });
  }
  if (action === 'send_password_reset') {
    const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
    if (targetError || !target.user?.email) throw Object.assign(new Error('未找到该用户邮箱'), { status: 404 });
    const response = await fetch(`${requiredEnv('SUPABASE_URL')}/auth/v1/recover`, {
      method: 'POST',
      headers: { apikey: Deno.env.get('SUPABASE_ANON_KEY') || requiredEnv('SUPABASE_PUBLISHABLE_KEY'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: target.user.email, redirect_to: APP_URL }),
    });
    if (!response.ok) throw Object.assign(new Error('发送密码重设邮件失败'), { status: response.status });
    await audit(admin, actor, action, userId);
    return json(request, { ok: true });
  }
  throw Object.assign(new Error('不支持的管理员操作'), { status: 400 });
}

export default {
  fetch: async (request: Request) => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
    try {
      const { admin, actor } = await currentAdmin(request);
      const url = new URL(request.url);
      const action = url.searchParams.get('action') || '';
      if (request.method === 'GET' && action === 'status') return json(request, { is_admin: true, email: actor.email || '' });
      if (request.method === 'GET' && action === 'users') {
        const page = Math.min(Math.max(Number(url.searchParams.get('page')) || 1, 1), MAX_USER_PAGE);
        return listUsers(request, admin, actor, page);
      }
      if (request.method === 'GET' && action === 'user') return userData(request, admin, actor, url.searchParams.get('user_id') || '');
      if (request.method === 'POST') return changeUserState(request, admin, actor, action, await request.json().catch(() => ({})));
      return json(request, { error: '不支持的管理员请求' }, 405);
    } catch (error) {
      const message = error instanceof Error ? error.message : '管理员服务请求失败';
      const status = Number((error as { status?: number })?.status) || 500;
      return json(request, { error: message }, status);
    }
  },
};
