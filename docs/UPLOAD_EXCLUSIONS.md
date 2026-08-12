# GitHub 上传排除与外部配置记录

本仓库上传的是可复现的源代码、配置模板、测试和文档。以下内容不会进入 GitHub；原因和恢复方式在本表中记录。

| 未上传内容 | 原因 | 由谁保存 / 如何恢复 |
|---|---|---|
| `node_modules/`、`build/`、`dist-mobile/` | 可由 `npm ci`、`npm run build:mobile` 重新生成 | 本机或 GitHub Actions 生成 |
| `*.apk`、`*.aab`、`*.zip` | 构建产物较大，APK 由 Pages 工作流发布 | `npm run build:android` 或 GitHub Actions 重新生成 |
| `android/app/src/main/assets/`、iOS `public/` | Capacitor 同步生成 | `npm run sync:mobile` 重新生成 |
| `android/local.properties` | 只包含本机 Android SDK 路径 | Android Studio / SDK 环境生成 |
| `*.jks`、`*.keystore`、签名环境文件 | Android 签名私钥与密码 | 本机 `~/.config/suijian/android-signing.env`；GitHub Actions Secrets |
| `.env`、`supabase/.env*`、`*.pem`、`*.key` | 可能包含 API Key、数据库密码、证书或令牌 | 密钥管理工具、Supabase / GitHub Secrets |
| 用户日记、草稿、附件、登录令牌 | 用户私人数据，不属于源代码 | 浏览器本地存储与 Supabase 项目 |
| `.verification/`、`.playwright-cli/`、截图 | 本地验证临时文件 | 需要时本机重新生成 |

## 不属于 GitHub 的必要外部配置

这些项目不在仓库中，但完整运行线上版本时需要存在：

1. Supabase 项目及其数据库、Auth、Storage、Edge Function；
2. Supabase Auth 的 Site URL 与 Redirect URLs；
3. GitHub Pages 的 GitHub Actions 发布设置；
4. GitHub Actions 的 Android 签名 Secrets；
5. 用户自行填写的模型 API Key；
6. 本机 Android 打包环境：JDK 21、Android SDK、签名文件。

## 安全边界

Supabase Publishable Key 可以放在前端代码中，它只能配合 RLS 访问受限数据；它不是 Service Role Key。Service Role Key、数据库密码、模型 API Key 和 Android 签名材料都不得提交到 Git。
