#!/bin/zsh
set -euo pipefail
ROOT="${0:A:h}"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$PATH"

cd "$ROOT"
npm run sync:mobile
(
  cd android
  ./gradlew --no-daemon --console=plain assembleDebug
)
cp android/app/build/outputs/apk/debug/app-debug.apk '岁笺-Android-v1.0-debug.apk'
printf 'APK: %s\n' "$ROOT/岁笺-Android-v1.0-debug.apk"
