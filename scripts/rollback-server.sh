#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="${SUJIAN_DEPLOY_CONFIG:-$ROOT/deploy/server.env}"
RELEASE_ID="${1:-}"
if [[ -z "$RELEASE_ID" ]]; then
  printf '用法：./scripts/rollback-server.sh <发布版本目录名>\n' >&2
  exit 2
fi
if [[ ! -r "$CONFIG_FILE" ]]; then
  printf '缺少服务器配置：%s\n' "$CONFIG_FILE" >&2
  exit 2
fi
# shellcheck disable=SC1090
source "$CONFIG_FILE"
target="${DEPLOY_USER}@${DEPLOY_HOST}"
ssh_args=(-p "$DEPLOY_PORT" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then ssh_args+=(-i "$DEPLOY_SSH_KEY"); fi
ssh "${ssh_args[@]}" "$target" "set -eu; test -d '${DEPLOY_ROOT}/releases/${RELEASE_ID}'; ln -sfn '${DEPLOY_ROOT}/releases/${RELEASE_ID}' '${DEPLOY_ROOT}/.site-next'; mv -Tf '${DEPLOY_ROOT}/.site-next' '${DEPLOY_ROOT}/site'"
printf '已切回服务器版本：%s\n' "$RELEASE_ID"
