#!/bin/zsh
set -euo pipefail
ROOT="${ROLLBACK_ROOT:-${0:A:h}}"
VERIFY="$ROOT/.verification/android-apk"

cp "$VERIFY/app-build.gradle.before.gradle" "$ROOT/android/app/build.gradle"
cp "$VERIFY/root-build.gradle.before.gradle" "$ROOT/android/build.gradle"
python3 - "$ROOT" <<'PY'
from pathlib import Path
import sys
root = Path(sys.argv[1])
for relative in ('android/local.properties', '岁笺-Android-v1.0-debug.apk'):
    path = root / relative
    if path.exists() or path.is_symlink():
        path.unlink()
PY
printf 'Rollback complete: restored Android Gradle files and removed local installer/config.\n'
