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
for variable in DEPLOY_HOST DEPLOY_USER DEPLOY_PORT DEPLOY_ROOT; do
  if [[ -z "${!variable:-}" ]]; then printf '部署配置缺少 %s。\n' "$variable" >&2; exit 2; fi
done
target="${DEPLOY_USER}@${DEPLOY_HOST}"
ssh_args=(-p "$DEPLOY_PORT" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then ssh_args+=(-i "$DEPLOY_SSH_KEY"); fi
rsync_ssh="ssh -p $DEPLOY_PORT -o BatchMode=yes -o StrictHostKeyChecking=accept-new"
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then rsync_ssh+=" -i $DEPLOY_SSH_KEY"; fi

printf '准备 /srv/suijian 的版本目录…\n'
ssh "${ssh_args[@]}" "$target" "sudo install -d -o '$DEPLOY_USER' -g '$DEPLOY_USER' -m 755 '${DEPLOY_ROOT}/releases/initial'; if [ -e '${DEPLOY_ROOT}/site' ] && [ ! -L '${DEPLOY_ROOT}/site' ]; then sudo mv '${DEPLOY_ROOT}/site' '${DEPLOY_ROOT}/releases/legacy-before-server-deploy'; fi; sudo ln -sfn '${DEPLOY_ROOT}/releases/initial' '${DEPLOY_ROOT}/site'"
printf '安装 Caddy 站点配置…\n'
rsync -az -e "$rsync_ssh" "$ROOT/deploy/Caddyfile" "$target:/tmp/suijian.Caddyfile"
ssh "${ssh_args[@]}" "$target" "sudo install -m 644 /tmp/suijian.Caddyfile /etc/caddy/Caddyfile; sudo caddy validate --config /etc/caddy/Caddyfile; sudo systemctl reload caddy"
printf '服务器初始化完成。接着运行 ./scripts/deploy-server.sh。\n'
