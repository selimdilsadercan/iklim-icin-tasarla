import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iklimicin.tasarla',
  appName: 'İklim İçin Tasarla',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;