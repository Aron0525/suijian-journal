#!/bin/zsh
set -euo pipefail
ROOT="${0:A:h}"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$PATH"

if [[ -f "$HOME/.config/suijian/android-signing.env" ]]; then
  source "$HOME/.config/suijian/android-signing.env"
fi

cd "$ROOT"
VERSION_NAME="$(node -p "require('./mobile-version.json').versionName")"
npm run sync:mobile
(
  cd android
  ./gradlew --no-daemon --console=plain assembleRelease
)
APK="岁笺-Android-v${VERSION_NAME}.apk"
cp android/app/build/outputs/apk/release/app-release.apk "$APK"
node scripts/build-native-update-manifest.mjs --apk "$APK"
printf 'APK: %s\n' "$ROOT/$APK"
