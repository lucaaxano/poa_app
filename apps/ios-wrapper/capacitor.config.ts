import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.poaplatform.ios',
  appName: 'POA',
  webDir: 'www',
  server: {
    url: 'https://poa-platform.de/login',
    cleartext: false,
    allowNavigation: ['poa-platform.de', '*.poa-platform.de'],
  },
  ios: {
    scheme: 'POA',
    contentInset: 'never',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 10000,
      backgroundColor: '#ffffff',
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
      overlaysWebView: false,
    },
  },
};

export default config;
