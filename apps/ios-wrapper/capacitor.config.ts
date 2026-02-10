import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.poa-platform.ios',
  appName: 'POA',
  webDir: 'www',
  server: {
    url: 'https://poa-platform.de',
    cleartext: false,
    allowNavigation: ['poa-platform.de', '*.poa-platform.de'],
  },
  ios: {
    scheme: 'POA',
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#1e40af',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1e40af',
    },
  },
};

export default config;
