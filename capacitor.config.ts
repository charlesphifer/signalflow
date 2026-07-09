import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.signalflow.app',
  appName: 'SignalFlow',
  webDir: 'dist',
  
  // To enable live debugging/instant updates on your Samsung Galaxy over Wi-Fi,
  // uncomment the server block below. Make sure your local Vite dev server is running.
  /*
  server: {
    url: 'http://192.168.1.181:5173',
    cleartext: true
  }
  */
};

export default config;
