# 自有服务器发布（方案 B）

运行链路：`手机 / 电脑 → https://933647.xyz → Caddy → /srv/suijian/site → Supabase → 大模型 API`。GitHub 仅保存源代码、提交记录和可选的备份校验，不承载网页、APK、OTA 或用户数据。

## 一次性初始化

1. 域名 A/AAAA 记录指向服务器，并在防火墙开放 TCP 80、443；服务器安装并启动 Caddy、SSH、rsync。
2. 在本机创建私钥配置文件：

   ```bash
   cp deploy/server.env.example deploy/server.env
   chmod 600 deploy/server.env
   ```

   填入服务器 IP、`deploy` 用户、SSH 私钥路径。服务器上的 `deploy` 用户需要有 `sudo` 权限，以便首次写入 Caddy 配置。
3. 执行初始化：

   ```bash
   ./scripts/bootstrap-server.sh
   ```

   脚本创建 `/srv/suijian/releases/`，让 `/srv/suijian/site` 指向当前发布版本，并安装仓库内的 `deploy/Caddyfile`。Caddy 自动申请 HTTPS 证书。

## 日常一键发布

先提交代码，再执行：

```bash
./scripts/deploy-server.sh
```

脚本依次运行代码检查、完整测试、`npm run build:android`，将 `dist-mobile/` 上传到新的版本目录，再原子切换 `/srv/suijian/site`。完成线上 `app-update.json` 与 `native-app-update.json` 检查后，默认执行 `git push origin main` 作为 GitHub 备份。

仅发布服务器、不推送备份：

```bash
PUSH_GITHUB_BACKUP=0 ./scripts/deploy-server.sh
```

网页/PWA 在下次打开时更新；已安装 Android App 按既有机制读取 OTA 清单；新版原生安装包位于 `https://933647.xyz/downloads/suijian-android-latest.apk`。

## 回退

服务器保留每次发布目录。列出目录后执行：

```bash
ssh deploy@SERVER_IP 'ls -1 /srv/suijian/releases'
./scripts/rollback-server.sh 20260910T123456Z-abcdef0
```

回退仅改 `/srv/suijian/site` 指向，不改 Supabase 数据，也不改 Git 历史。
