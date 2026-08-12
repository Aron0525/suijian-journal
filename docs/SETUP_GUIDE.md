# 岁笺仓库配置指南

这份文档给第一次接手项目的人使用。仓库内已有前端、PWA、Android 工程、GitHub Pages 工作流和 Supabase 配置脚本；外部平台仍需要按下面步骤完成一次配置。

## 先理解三类平台

| 平台 | 做什么 | 是否保存日记 |
|---|---|---|
| GitHub / GitHub Pages | 保存代码，自动测试、发布网页、提供更新包与 APK 下载 | 不保存 |
| Supabase | 注册登录、云同步、数据库、私有附件、AI 代理 | 保存 |
| DeepSeek / OpenAI 等 | 生成 AI 整理和 AI 汇总结果 | 只在调用时接收本次请求 |

## A. 本机运行

### 安装条件

- Node.js 22；
- Python 3；
- Android 打包额外需要 JDK 21、Android SDK 和签名配置；
- Git 与 GitHub 账号。

### 启动

```bash
git clone https://github.com/Aron0525/suijian-journal.git
cd suijian-journal
npm ci
npm test
python3 server.py
```

浏览器打开 `http://127.0.0.1:4173/`。本地模式下，`server.py` 同时提供静态网页和 `/api/ai` 代理；它不是线上部署必需的常驻程序。

## B. 配置 Supabase

### 第 1 步：执行数据库脚本

1. 打开 Supabase 项目。
2. 进入 **SQL Editor**。
3. 打开仓库文件 `supabase/schema.sql`，复制全部内容并执行。
4. 在输出中确认没有 SQL 错误。

这个动作会创建日记、每日摘要、区间汇总、待办表和私有附件桶，并设置 RLS（行级安全）：登录用户只能访问自己账号的数据。

### 第 2 步：配置邮箱登录回跳

进入 **Authentication → URL Configuration**：

- **Site URL** 填：`https://aron0525.github.io/suijian-journal/`
- **Redirect URLs** 依次增加：
  - `https://aron0525.github.io/suijian-journal/**`
  - `http://127.0.0.1:4173/**`
  - `http://localhost:4173/**`

这样用户注册并点击验证邮件后，能回到岁笺页面。

### 第 3 步：部署线上 AI 代理

安装并登录 Supabase CLI 后执行：

```bash
supabase login
supabase link --project-ref <项目-ref>
supabase functions deploy ai-proxy
supabase secrets set AI_ALLOWED_HOSTS=api.deepseek.com,api.openai.com
```

`AI_ALLOWED_HOSTS` 是 AI 服务商域名白名单。项目默认支持 DeepSeek 与 OpenAI；使用其他兼容服务商时，把域名追加到该变量。

模型 API Key 不需要、也不应写入 Supabase Secret。用户在岁笺的“模型配置”窗口临时输入 Key，线上函数只转发本次请求。

## C. 配置 GitHub Pages

仓库已包含 `.github/workflows/deploy-pages.yml`。在 GitHub 仓库中：

1. 进入 **Settings → Pages**；
2. 将 Source 设为 **GitHub Actions**；
3. 向 `main` 推送一次提交；
4. 在 **Actions** 查看 `Deploy PWA to GitHub Pages` 是否成功；
5. 打开 `https://aron0525.github.io/suijian-journal/` 验证网页。

这个工作流会执行 `npm test`，随后构建 PWA、网页更新包与 Android APK，并把 `dist-mobile/` 发布到 Pages。

## D. 配置 Android 签名和 APK

Android 包由 Capacitor 生成，源码在 `android/`。本机打包运行：

```bash
npm run build:android
```

脚本会读取本机文件：

```text
~/.config/suijian/android-signing.env
```

示例内容如下，路径与密码均由你自己填写：

```bash
export SUJIAN_ANDROID_KEYSTORE=/absolute/path/to/suijian-release.jks
export SUJIAN_ANDROID_STORE_PASSWORD=<store-password>
export SUJIAN_ANDROID_KEY_ALIAS=<key-alias>
export SUJIAN_ANDROID_KEY_PASSWORD=<key-password>
```

GitHub Actions 也需要同一证书对应的 4 个 Secrets：

```text
SUJIAN_ANDROID_KEYSTORE_BASE64
SUJIAN_ANDROID_STORE_PASSWORD
SUJIAN_ANDROID_KEY_ALIAS
SUJIAN_ANDROID_KEY_PASSWORD
```

其中 `SUJIAN_ANDROID_KEYSTORE_BASE64` 是 `.jks` 文件的单行 Base64 内容。换证书或变更原生权限、插件时，需要发布新版 APK；普通网页功能和样式更新由 App 的网页更新机制下发。

## E. 使用 AI 功能

在页面右上角打开“模型配置”，填写：

- API 地址，例如 `https://api.deepseek.com`；
- 模型名称，例如服务商实际提供的模型 ID；
- API Key；
- AI 整理提示词和 AI 汇总提示词。

API Key 只存在当前浏览器或 App 会话中。刷新或关闭后需要再次填写；日记正文、提示词、登录账号与模型 Key 的保存位置并不相同。

## F. 换 GitHub 仓库或 Supabase 项目时

这不是只改一个链接的操作。请根据 `docs/AI_SETUP_GUIDE.md` 的“仓库改名或迁移到新账号时”表格逐项替换 GitHub Pages URL、Supabase 项目 ID、默认 Supabase URL/Publishable Key、CSP 允许域名和 Supabase Auth 回跳地址，再运行：

```bash
npm test
npm run build:mobile
npm run build:android
```

## G. 配置后检查清单

- [ ] `npm test` 通过；
- [ ] GitHub Pages Actions 成功，线上网址可打开；
- [ ] Supabase `schema.sql` 已执行；
- [ ] 注册邮件能回跳到网页；
- [ ] 手机和电脑用同一邮箱登录后可同步；
- [ ] 图片或附件可上传并在另一台设备下载；
- [ ] AI 整理与日期范围汇总都能返回结果；
- [ ] Android APK 可安装，提醒权限与更新检查正常。

如需知道哪些文件刻意不进入 GitHub，查看 `docs/UPLOAD_EXCLUSIONS.md`。
