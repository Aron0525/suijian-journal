#!/bin/sh
set -eu

TARGET="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
MODE="check"

if [ "${1:-}" = "--target" ]; then
  TARGET="$2"
  shift 2
fi
if [ "${1:-}" = "--apply" ]; then
  MODE="apply"
fi

if [ "$MODE" = "check" ]; then
  if [ -d "$TARGET" ]; then
    printf 'rollback-check: target exists: %s\n' "$TARGET"
  else
    printf 'rollback-check: target already absent: %s\n' "$TARGET"
  fi
  printf 'rollback-check: run with --apply to remove the generated PWA directory.\n'
  exit 0
fi

python3 - "$TARGET" <<'PY'
from pathlib import Path
import shutil
import sys
path = Path(sys.argv[1]).resolve()
if path.exists():
    shutil.rmtree(path)
print(f'rollback-applied: removed {path}')
PY
