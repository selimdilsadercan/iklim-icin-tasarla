import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iklimicin.tasarla',
  appName: 'İklim İçin Tasarla',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#eff6ff',
      overlaysWebView: false
    }
  }
};

export default config;