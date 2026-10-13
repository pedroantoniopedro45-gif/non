import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.avicontrolpro.app',
  appName: 'AVEGESTOR by AgroConnect',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
