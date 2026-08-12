# 岁笺 · 日历日记 PWA

一个本地优先的基础日历日记网站：记录按日期保存在浏览器本地，支持离线草稿、日历浏览、右上角搜索与汇总窗口、导入导出、真实模型 API 整理，以及跨日期范围的 AI 汇总。

## 运行

```bash
cd /Users/mac/Desktop/test/calendar-journal-pwa
python3 server.py
```

访问 <http://localhost:4173>。应用会运行在 `http://127.0.0.1:4173`。`server.py` 同时提供静态 PWA 和 `/api/ai` 同源代理，避开第三方模型 API 的浏览器跨域限制；日记数据保存在当前浏览器的 `localStorage` 中。

## AI 使用方式

1. 点击顶部“模型配置”。
2. 填写服务商 API 地址、模型 ID 和 API Key；基础地址会自动补全为 Chat Completions 请求地址。
3. “AI 整理”旁的“整理提示词”和“AI 总结”旁的“汇总提示词”可分别编辑两段实际调用的提示词；它们会保存到当前浏览器。API Key 只保留在当前页面会话，刷新或关闭页面后需要重新填写。两个提示词都支持 `{{输入内容}}` 占位符，系统会替换为当前日记或所选范围的原始记录。
4. 在日记输入框点击“AI 整理”。AI 的建议显示在原文下方，点击“采用建议并替换”后才会覆盖输入框文本；保存时会将替换前的原文一并保留。
5. 点击右上角“汇总”，在弹出的窗口选择起止日期，点击“AI 汇总这段时间”。汇总是独立内容，来源日记始终只读。

调用时由本地 `server.py` 或已登录的 Supabase Edge Function 代理转发，代理不落盘保存 API Key。为防止日记和 Key 被发送到未知地址，默认只允许 `api.deepseek.com` 与 `api.openai.com`；如需其他兼容服务商，在部署本地服务或 Edge Function 时设置 `AI_ALLOWED_HOSTS=api.example.com,api.other.com`。本地服务接入使用私有 CA 的企业模型网关时，可额外设置 `AI_TRUSTED_CA_FILE=/absolute/path/to/ca.pem`；TLS 校验不会被关闭。正式多人版应使用服务端密钥管理和用户级访问控制。

## 当前功能

- 每日多条日记记录与自动本地草稿
- 单页工作台：写日记、当天片段与日历档案连续呈现；档案支持单日与日期范围筛选，右侧紧凑月历用于选择日期
- 分别配置整理与汇总提示词的真实模型 API 能力；整理确认后替换并保留原文
- 右上角搜索窗口与多日区间汇总窗口；AI 当天摘要与跨日汇总均不改写来源日记
- JSON 完整备份导出与查重导入
- PWA manifest 与离线缓存


### DeepSeek 配置示例

- API 地址：`https://api.deepseek.com`（也可填写完整的 `https://api.deepseek.com/chat/completions`）
- 模型名称：`deepseek-v4-flash`
- API Key：从 DeepSeek 开放平台创建的 Key

本地代理会自动把基础地址补为 `/chat/completions`。

## 云同步（Supabase）

右上角“登录 / 账号”会打开独立的账号窗口；“同步”在已登录后直接执行同步。项目地址已预填为当前同步项目；首次使用时，在 Supabase 控制台进入 **Settings → API keys**，复制 **Publishable Key** 粘贴并保存，然后使用邮箱和密码注册或登录。

- 手机和电脑登录**同一邮箱**，新建、删除日记及生成的摘要会自动排队同步；也可以点击“立即同步”。为避免共享设备串号，切换到另一个账号时必须先显式确认，应用不会自动迁移本地日记。
- 每次登录、回到页面或网络恢复时会拉取云端内容，再按 `updatedAt` 合并；删除会作为同步标记保留，另一台设备也会删除同一条内容。
- 云端只保存日记、当天摘要和跨日汇总；草稿继续只留在当前设备。模型 API Key 不进入浏览器持久化存储；登录会话仅保留在当前浏览器或 App 会话中，页面刷新保持登录，关闭浏览器或 App 后重新登录。账号窗口会记录注册、登录、退出和手动同步结果。
- 数据库表、更新时间触发器、陈旧版本拦截器和按用户隔离的 RLS（行级安全）规则在 `supabase/schema.sql` 中。修改后请在 Supabase SQL Editor 重新执行该文件；项目配置只使用 Publishable Key，项目管理 Key 与数据库密码不进入前端代码。

注册后需完成验证邮件中的确认，再回到“登录 / 账号”窗口使用同一邮箱登录。Supabase 的 **Authentication → URL Configuration** 需要将线上站点设为 Site URL，并将该站点（及本地调试地址）加入 Redirect URLs。

## 代码与网页发布（GitHub + GitHub Pages）

- GitHub 仓库保存代码、提交记录和自动化部署工作流；日记内容、模型 API Key、登录会话和 Supabase 私钥不进入仓库。
- 推送到 `main` 后，GitHub Actions 会运行 `npm ci`、`npm test`、`npm run build:mobile`，再把 `dist-mobile/` 发布到 GitHub Pages。工作流在 `.github/workflows/deploy-pages.yml`。
- GitHub Pages 站点地址形如 `https://<GitHub 用户名>.github.io/<仓库名>/`。发布完成后，在 Supabase **Authentication → URL Configuration** 中把此地址设为 Site URL，并增加 `https://<GitHub 用户名>.github.io/<仓库名>/**` 到 Redirect URLs；邮箱验证后会回到这个网址。
- 该项目的静态资源、PWA Manifest、Service Worker 都使用相对路径，因此可以部署在 GitHub Pages 的仓库子路径下。

当前线上地址：[https://aron0525.github.io/suijian-journal/](https://aron0525.github.io/suijian-journal/)；代码仓库：[Aron0525/suijian-journal](https://github.com/Aron0525/suijian-journal)。

## Android App（原生安装包）

Android 已使用 Capacitor 原生壳打包，安装包内置 `dist-mobile/` 的页面资源，不通过浏览器打开网站。当前可直接安装的 APK：`岁笺-Android-v1.0-debug.apk`。

- 手机安装：将 APK 传到 Android 手机，打开文件并允许本次“安装未知应用来源”，安装后桌面会出现“岁笺”。
- 数据：登录与同步仍连接 Supabase；AI 功能仍连接已配置的模型 API；网页资源由 GitHub Pages 发布。
- 自动更新：安装本次 APK 后，App 会在启动、回到前台、网络恢复及每 10 分钟检查 GitHub Pages 的更新清单；新网页包通过 SHA-256 校验后下载，并在 App 退出、切到后台或下次重开时自动启用。更新异常会继续使用上一份已验证的页面包。
- 重新打包：在已安装 JDK 21 与 Android SDK 的电脑上运行 `./build-android-apk.sh`。
- 回退构建改动：运行 `./rollback-android-apk.sh`。

`npm run build:mobile` 会生成内置网页资源 `dist-mobile/`。移动端 AI 使用 Supabase Edge Function `ai-proxy`，代码在 `supabase/functions/ai-proxy/index.ts`，并要求先登录同步账号；本机 `127.0.0.1` 调试仍使用 `server.py`。
