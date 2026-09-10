import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

const APP_ORIGIN = 'https://933647.xyz';
const APP_URL = `${APP_ORIGIN}/`;
const ADMIN_EMAIL = 'rili66@outlook.com';
const ALLOWED_ORIGINS = new Set([APP_ORIGIN, 'https://aron0525.github.io', 'capacitor://localhost', 'https://localhost', 'http://localhost', 'http://127.0.0.1:4173']);
const USER_PAGE_SIZE = 100;
const MAX_USER_PAGE = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const { error: allowedError } = await admin
    .from('journal_admins')
    .upsert({ user_id: data.user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (allowedError) throw Object.assign(new Error('管理员权限尚未初始化，请先执行数据库迁移'), { status: 503 });
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

async function queryUserDataset(label: string, query: PromiseLike<{ data: unknown; error: { message?: string } | null }>) {
  try {
    const result = await query;
    return {
      data: result.error ? [] : (result.data ?? []),
      warning: result.error ? `${label}：${result.error.message || '读取失败'}` : '',
    };
  } catch (error) {
    return { data: [], warning: `${label}：${error instanceof Error ? error.message : '读取失败'}` };
  }
}

async function listAttachmentFiles(admin: SupabaseClient, userId: string) {
  const bucket = admin.storage.from('journal-attachments');
  const queue = [userId];
  const files: Record<string, unknown>[] = [];
  const warnings: string[] = [];
  while (queue.length && files.length < 2000) {
    const prefix = queue.shift() || userId;
    const { data, error } = await bucket.list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
    if (error) {
      warnings.push(`附件目录 ${prefix}：${error.message}`);
      continue;
    }
    for (const item of data || []) {
      const path = `${prefix}/${item.name}`;
      if (item.id) files.push({ ...item, path });
      else queue.push(path);
    }
  }
  if (queue.length) warnings.push('附件超过 2000 个，本次只显示前 2000 个。');
  return { files, warnings };
}

function attachmentBytes(attachments: unknown) {
  if (!Array.isArray(attachments)) return { count: 0, bytes: 0 };
  return attachments.reduce((total, attachment) => {
    if (!attachment || typeof attachment !== 'object') return total;
    const record = attachment as Record<string, unknown>;
    const metadata = record.metadata && typeof record.metadata === 'object' ? record.metadata as Record<string, unknown> : {};
    const bytes = Number(record.size ?? record.bytes ?? metadata.size) || 0;
    return { count: total.count + 1, bytes: total.bytes + Math.max(bytes, 0) };
  }, { count: 0, bytes: 0 });
}

function userActivityStats(rows: Record<string, unknown>[], userIds: string[]) {
  const stats = new Map(userIds.map((userId) => [userId, { entry_count: 0, attachment_count: 0, attachment_bytes: 0 }]));
  rows.forEach((row) => {
    const userId = String(row.user_id || '');
    const current = stats.get(userId);
    if (!current) return;
    const attachments = attachmentBytes(row.attachments);
    current.entry_count += 1;
    current.attachment_count += attachments.count;
    current.attachment_bytes += attachments.bytes;
  });
  return stats;
}

async function listUsers(request: Request, admin: SupabaseClient, actor: User, page: number) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: USER_PAGE_SIZE });
  if (error) throw error;
  const userIds = data.users.map((user) => user.id);
  const [{ data: entryRows, error: entryError }, { data: roleRows, error: roleError }] = await Promise.all([
    userIds.length
      ? admin.from('journal_entries').select('user_id, attachments').in('user_id', userIds).is('deleted_at', null)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? admin.from('journal_admins').select('user_id').in('user_id', userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const stats = userActivityStats((entryError ? [] : (entryRows || [])) as Record<string, unknown>[], userIds);
  const adminIds = new Set((roleError ? [] : (roleRows || [])).map((row) => String(row.user_id)));
  await audit(admin, actor, 'list_users', null, { page });
  return json(request, {
    users: data.users.map((user) => ({
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at || null,
      email_confirmed_at: user.email_confirmed_at || null,
      banned_until: user.banned_until || null,
      role: adminIds.has(user.id) ? 'admin' : 'user',
      ...(stats.get(user.id) || { entry_count: 0, attachment_count: 0, attachment_bytes: 0 }),
    })),
    next_page: data.nextPage || null,
  });
}

async function userData(request: Request, admin: SupabaseClient, actor: User, userId: string) {
  userId = userId.trim();
  if (!UUID.test(userId)) throw Object.assign(new Error('用户标识无效'), { status: 400 });
  const userResult = await admin.auth.admin.getUserById(userId);
  if (userResult.error || !userResult.data.user) throw userResult.error || Object.assign(new Error('用户不存在'), { status: 404 });
  const [entries, drafts, daily, periods, tasks, backups, aiSettings, auditEvents, adminRole, attachmentResult] = await Promise.all([
    queryUserDataset('日记', admin.from('journal_entries').select('*').eq('user_id', userId).order('updated_at', { ascending: false })),
    queryUserDataset('草稿', admin.from('journal_drafts').select('*').eq('user_id', userId).order('updated_at', { ascending: false })),
    queryUserDataset('当天摘要', admin.from('daily_summaries').select('*').eq('user_id', userId).order('updated_at', { ascending: false })),
    queryUserDataset('阶段总结', admin.from('period_summaries').select('*').eq('user_id', userId).order('updated_at', { ascending: false })),
    queryUserDataset('待办', admin.from('journal_tasks').select('*').eq('user_id', userId).order('updated_at', { ascending: false })),
    queryUserDataset('云端备份', admin.from('journal_backups').select('*').eq('user_id', userId).order('backup_date', { ascending: false })),
    queryUserDataset('模型配置', admin.from('ai_settings').select('*').eq('user_id', userId).maybeSingle()),
    queryUserDataset('管理员操作记录', admin.from('admin_audit_events').select('action, actor_user_id, detail, created_at').eq('target_user_id', userId).order('created_at', { ascending: false }).limit(100)),
    queryUserDataset('角色', admin.from('journal_admins').select('user_id').eq('user_id', userId).maybeSingle()),
    listAttachmentFiles(admin, userId),
  ]);
  const warnings = [entries.warning, drafts.warning, daily.warning, periods.warning, tasks.warning, backups.warning, aiSettings.warning, auditEvents.warning, adminRole.warning, ...attachmentResult.warnings].filter(Boolean);
  const entryRows = Array.isArray(entries.data) ? entries.data : [];
  await audit(admin, actor, 'view_user_data', userId, { entry_count: entryRows.length, warnings });
  const targetUser = userResult.data.user;
  const providers = Array.isArray(targetUser.app_metadata?.providers)
    ? targetUser.app_metadata.providers.map(String)
    : (targetUser.app_metadata?.provider ? [String(targetUser.app_metadata.provider)] : []);
  return json(request, {
    user: {
      id: targetUser.id,
      email: targetUser.email || '',
      created_at: targetUser.created_at,
      last_sign_in_at: targetUser.last_sign_in_at || null,
      email_confirmed_at: targetUser.email_confirmed_at || null,
      banned_until: targetUser.banned_until || null,
      credential: { providers, password_login_available: providers.includes('email') },
      role: adminRole.data && !Array.isArray(adminRole.data) ? 'admin' : 'user',
    },
    data: {
      entries: entryRows,
      drafts: Array.isArray(drafts.data) ? drafts.data : [],
      daily_summaries: Array.isArray(daily.data) ? daily.data : [],
      period_summaries: Array.isArray(periods.data) ? periods.data : [],
      tasks: Array.isArray(tasks.data) ? tasks.data : [],
      backups: Array.isArray(backups.data) ? backups.data : [],
      ai_settings: safeAiSettings(aiSettings.data && !Array.isArray(aiSettings.data) ? aiSettings.data as Record<string, unknown> : null),
      attachments: attachmentResult.files,
      audit_events: Array.isArray(auditEvents.data) ? auditEvents.data : [],
      data_warnings: warnings,
    },
  });
}

async function changeUserState(request: Request, admin: SupabaseClient, actor: User, action: string, payload: Record<string, unknown>) {
  const userId = String(payload.user_id || '').trim();
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
  if (action === 'record_export') {
    const format = payload.format === 'excel' ? 'excel' : 'json';
    await audit(admin, actor, `export_user_${format}`, userId);
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
        return await listUsers(request, admin, actor, page);
      }
      if (request.method === 'GET' && action === 'user') return await userData(request, admin, actor, url.searchParams.get('user_id') || '');
      if (request.method === 'POST') return await changeUserState(request, admin, actor, action, await request.json().catch(() => ({})));
      return json(request, { error: '不支持的管理员请求' }, 405);
    } catch (error) {
      const message = error instanceof Error ? error.message : '管理员服务请求失败';
      const status = Number((error as { status?: number })?.status) || 500;
      return json(request, { error: message }, status);
    }
  },
};
