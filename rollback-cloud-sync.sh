#!/bin/sh
set -eu

TARGET="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
if [ "${1:-}" = "--target" ]; then
  TARGET="$2"
  shift 2
fi

PATCH_FILE="$TARGET/.verification/cloud-sync.patch"
if [ ! -f "$PATCH_FILE" ]; then
  printf 'cloud-sync-rollback: patch not found: %s\n' "$PATCH_FILE" >&2
  exit 1
fi

patch -d "$TARGET" -R -p1 < "$PATCH_FILE"
rm -f "$TARGET/supabase/schema.sql" "$TARGET/rollback-cloud-sync.sh"
rmdir "$TARGET/supabase" 2>/dev/null || true
printf 'cloud-sync-rollback: restored pre-cloud-sync workspace at %s\n' "$TARGET"
