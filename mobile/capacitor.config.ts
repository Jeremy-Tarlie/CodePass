import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.codepass.mobile',
  appName: 'CodePass',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
