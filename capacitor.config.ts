import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fleettracker.servicesApp',
  appName: 'fleet-tracker-services',
  webDir: 'www',
  server: {
    allowNavigation: [
      'http://51.222.16.164:8082',
      'https://fleettrack-backend-monitoring.onrender.com'
    ],
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;
