#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="${SUJIAN_DEPLOY_CONFIG:-$ROOT/deploy/server.env}"

if [[ ! -r "$CONFIG_FILE" ]]; then
  printf '缺少服务器配置：请复制 deploy/server.env.example 为 deploy/server.env 并填写连接信息。\n' >&2
  exit 2
fi

# shellcheck disable=SC1090
source "$CONFIG_FILE"
for variable in DEPLOY_HOST DEPLOY_USER DEPLOY_PORT DEPLOY_ROOT DEPLOY_DOMAIN; do
  if [[ -z "${!variable:-}" ]]; then
    printf '部署配置缺少 %s。\n' "$variable" >&2
    exit 2
  fi
done
for command in git node npm rsync ssh curl; do
  command -v "$command" >/dev/null || { printf '缺少命令：%s\n' "$command" >&2; exit 2; }
done
if ! [[ "$DEPLOY_PORT" =~ ^[0-9]{1,5}$ ]]; then
  printf 'DEPLOY_PORT 必须是端口号。\n' >&2
  exit 2
fi
if [[ -n "${DEPLOY_SSH_KEY:-}" && ! -r "$DEPLOY_SSH_KEY" ]]; then
  printf 'DEPLOY_SSH_KEY 指向的私钥不可读取。\n' >&2
  exit 2
fi

cd "$ROOT"
if ! git diff --quiet || ! git diff --cached --quiet; then
  printf '请先提交当前代码，再执行服务器发布；这样 GitHub 备份与服务器版本保持一致。\n' >&2
  exit 2
fi

target="${DEPLOY_USER}@${DEPLOY_HOST}"
ssh_args=(-p "$DEPLOY_PORT" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then ssh_args+=(-i "$DEPLOY_SSH_KEY"); fi
rsync_ssh="ssh -p $DEPLOY_PORT -o BatchMode=yes -o StrictHostKeyChecking=accept-new"
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then rsync_ssh+=" -i $DEPLOY_SSH_KEY"; fi

release_id="$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short HEAD)"
release_path="${DEPLOY_ROOT}/releases/${release_id}"

printf '1/4 校验代码…\n'
npm run check
npm test
npm run check:native-version
printf '2/4 构建网页、OTA 和已签名 Android 安装包…\n'
npm run build:android
printf '3/4 发布到 %s…\n' "$DEPLOY_DOMAIN"
ssh "${ssh_args[@]}" "$target" "mkdir -p '$release_path'"
rsync -az --delete --delay-updates -e "$rsync_ssh" "$ROOT/dist-mobile/" "$target:$release_path/"
ssh "${ssh_args[@]}" "$target" "set -eu; ln -sfn '$release_path' '${DEPLOY_ROOT}/.site-next'; mv -Tf '${DEPLOY_ROOT}/.site-next' '${DEPLOY_ROOT}/site'"
printf '4/4 校验线上入口…\n'
curl --fail --silent --show-error --head "https://${DEPLOY_DOMAIN}/app-update.json" >/dev/null
curl --fail --silent --show-error --head "https://${DEPLOY_DOMAIN}/native-app-update.json" >/dev/null
if [[ "${PUSH_GITHUB_BACKUP:-1}" == "1" ]]; then
  git push origin main
  printf '服务器已发布；GitHub 代码备份已推送。\n'
else
  printf '服务器已发布；本次跳过 GitHub 备份。\n'
fi
printf '发布版本：%s\n' "$release_id"
