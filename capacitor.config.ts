import { readFileSync } from 'node:fs';
import type { CapacitorConfig } from '@capacitor/cli';

function bundledUpdateVersion() {
  try {
    const manifest = JSON.parse(readFileSync(new URL('./dist-mobile/app-update.json', import.meta.url), 'utf8'));
    return typeof manifest.version === 'string' ? manifest.version : 'mobile-ota-builtin';
  } catch {
    return 'mobile-ota-builtin';
  }
}

const config: CapacitorConfig = {
  appId: 'com.suijian.journal',
  appName: '岁笺',
  webDir: 'dist-mobile',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // GitHub Pages publishes a signed-by-checksum static bundle. The app owns
    // the manifest check so it never needs a production remote WebView URL.
    CapacitorUpdater: {
      autoUpdate: 'off',
      appReadyTimeout: 10000,
      autoDeletePrevious: true,
      resetWhenUpdate: true,
      statsUrl: '',
      version: bundledUpdateVersion(),
    },
  },
};

export default config;
