import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nissani.reme',
  appName: 'ReMe',
  webDir: 'dist',
  server: {
    // Points the iOS simulator at your Mac's live Vite dev server.
    // Vite then proxies /api → localhost:3001, so no deployed backend needed.
    // Change this IP if your Mac's network address changes (run: ipconfig getifaddr en0).
    url: 'http://10.0.0.17:5173',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    scrollEnabled: false,
  },
};

export default config;
