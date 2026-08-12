# AI 配置运行手册

这份文档给接手本仓库的 AI 使用。目标是在不把密钥、用户日记或签名文件提交到 GitHub 的前提下，补齐项目运行所需的外部配置。

## 先读什么

按这个顺序读取：

1. `README.md`：产品能力和本地运行方式。
2. `docs/SETUP_GUIDE.md`：人工配置步骤和截图/控制台入口。
3. `docs/UPLOAD_EXCLUSIONS.md`：明确哪些文件不得提交。
4. `.github/workflows/deploy-pages.yml`：GitHub Pages、Android 构建与 Secrets 名称。
5. `supabase/schema.sql` 与 `supabase/functions/ai-proxy/index.ts`：数据库、Storage、AI 代理。
6. `app.js`、`scripts/build-mobile-web.mjs`、`scripts/build-native-update-manifest.mjs`：当前项目 URL 和更新地址。

## 当前仓库的外部状态

| 项目 | 状态 | AI 的下一步 |
|---|---|---|
| GitHub 仓库 | `Aron0525/suijian-journal`，公开仓库 | 直接向 `main` 推送；不要新建同名仓库。 |
| GitHub Pages | 已启用，发布地址为 `https://aron0525.github.io/suijian-journal/` | 推送后检查 Actions 的 Pages 工作流。 |
| Android 签名 Secrets | 4 个必需名称已存在 | 不读取、不打印、不替换其值。 |
| Supabase AI 代理 | `ai-proxy` 对 `OPTIONS` 返回 204 | 继续保持 JWT 验证；按需设置允许的模型域名。 |
| `journal_tasks` | 远程 REST 读取返回 404 | 首要动作：在 Supabase SQL Editor 执行 `supabase/schema.sql`。 |
| 附件桶 | 尚未以可用状态验证 | 与上一步一起由 `schema.sql` 创建私有桶和访问规则。 |

## 配置顺序

### 1. 本地预检

```bash
npm ci
npm test
python3 server.py
```

AI 应确认 `npm test` 通过后再发布。纯本地写日记与本地 AI 代理可运行；账号、跨端同步、云附件和线上 AI 依赖后续 Supabase 配置。

### 2. Supabase：先补齐数据库和附件桶

在目标 Supabase 项目的 **SQL Editor** 新建查询，粘贴并执行 `supabase/schema.sql` 的完整内容。它会创建：

- `journal_entries`、`daily_summaries`、`period_summaries`；
- `journal_tasks`；
- `journal-attachments` 私有 Storage 桶；
- 更新时间触发器、陈旧版本拦截和 RLS（行级安全）规则。

执行后以 Publishable Key 发起只读查询验证 `journal_tasks` 不再返回 404。AI 只使用 Publishable Key；Service Role Key 与数据库密码不进入前端、代码或 Git 提交。

### 3. Supabase：部署 AI 代理

在已登录 Supabase CLI 的终端中：

```bash
supabase link --project-ref <你的-project-ref>
supabase functions deploy ai-proxy
supabase secrets set AI_ALLOWED_HOSTS=api.deepseek.com,api.openai.com
```

`AI_ALLOWED_HOSTS` 只在使用额外 OpenAI 兼容服务商时扩充，例如 `api.example.com`。函数保持 JWT 验证，前端需先登录同步账号才能调用线上 AI。

### 4. Supabase Auth：配置回跳地址

在 **Authentication → URL Configuration** 填写：

- Site URL：`https://aron0525.github.io/suijian-journal/`
- Redirect URLs：
  - `https://aron0525.github.io/suijian-journal/**`
  - `http://127.0.0.1:4173/**`
  - `http://localhost:4173/**`

保持邮箱确认开启。注册用户点击邮件链接后，会回到岁笺并能继续登录。

### 5. GitHub Pages 和 Android 构建

工作流在 `.github/workflows/deploy-pages.yml`。它会运行测试、构建 PWA、构建已签名 APK，并发布 `dist-mobile/`。

Android 构建使用以下 GitHub Actions Secrets：

```text
SUJIAN_ANDROID_KEYSTORE_BASE64
SUJIAN_ANDROID_STORE_PASSWORD
SUJIAN_ANDROID_KEY_ALIAS
SUJIAN_ANDROID_KEY_PASSWORD
```

如果换签名证书，四项必须一起替换；否则新 APK 不会覆盖已安装版本。AI 只能检查名称是否存在，不能获取其内容。

### 6. 仓库改名或迁移到新账号时

先计算新地址：`https://<GitHub 用户名>.github.io/<仓库名>`，然后同步修改以下文件中的旧地址：

| 文件 | 要改的内容 |
|---|---|
| `app.js` | `MOBILE_OTA_MANIFEST_URL`、`NATIVE_APP_UPDATE_MANIFEST_URL`；若迁移 Supabase，还要改默认 URL 和 Publishable Key。 |
| `scripts/build-mobile-web.mjs` | `pagesBaseUrl`。 |
| `scripts/build-native-update-manifest.mjs` | `DEFAULT_BASE_URL`。 |
| `index.html`、`index.htm`、`server.py` | CSP 的 `connect-src` 中 GitHub Pages 域名。 |
| `supabase/config.toml` | `project_id`。 |
| Supabase Auth 控制台 | Site URL 与 Redirect URLs。 |

修改后运行：

```bash
npm test
npm run build:mobile
npm run build:android
```

## AI 请求输入与禁止项

AI 需要向操作者索取或由浏览器控制台完成的内容：Supabase 项目控制台权限、GitHub 仓库管理员权限、Android 签名证书对应的四项 Secrets、模型 API Key（由最终用户在页面输入）。

AI 不得将以下内容写进仓库、Issue、日志、截图或提交信息：模型 API Key、Supabase Service Role Key、数据库密码、`.jks`/`.keystore`、Android 签名密码、用户日记、附件原文、登录令牌。

## 完成判定

配置完成后应保留以下证据：

```bash
npm test
npm run build:mobile
# 有 JDK 21、Android SDK 和签名环境时：
npm run build:android
```

另在浏览器完成一次注册、登录、保存日记、同步、上传小附件和 AI 整理验证。所有检查通过后再提交和推送。
