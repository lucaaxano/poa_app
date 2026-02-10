/**
 * Capacitor Bridge - Native iOS feature integration
 *
 * This module provides a bridge between the web app and native iOS features
 * when running inside the Capacitor wrapper. All functions are safe to call
 * in any environment - they gracefully no-op when not in a native context.
 *
 * IMPORTANT: Uses window.Capacitor.Plugins instead of package imports,
 * so no Capacitor dependencies are needed in the web app's package.json.
 * This ensures the web app build is not affected.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CapacitorPlugins = Record<string, any>;

/**
 * Get Capacitor plugins from the global window object.
 * Returns null when not running in a native Capacitor shell.
 */
function getPlugins(): CapacitorPlugins | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  return cap?.Plugins ?? null;
}

// Detect if running inside Capacitor native shell
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(window as any).Capacitor;
}

// Detect specifically iOS native
export function isIOSNativeApp(): boolean {
  if (!isNativeApp()) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  return cap?.getPlatform?.() === 'ios' || cap?.platform === 'ios';
}

// ============================================
// Splash Screen
// ============================================

let splashScreenHidden = false;

export async function hideSplashScreen(): Promise<void> {
  if (!isNativeApp() || splashScreenHidden) return;
  try {
    const plugins = getPlugins();
    if (!plugins?.SplashScreen) return;
    await plugins.SplashScreen.hide({ fadeOutDuration: 300 });
    splashScreenHidden = true;
  } catch {
    // Not in native context or plugin not available
  }
}

// ============================================
// Status Bar
// ============================================

export async function configureStatusBar(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const plugins = getPlugins();
    if (!plugins?.StatusBar) return;
    await plugins.StatusBar.setStyle({ style: 'DARK' });
  } catch {
    // Not in native context or plugin not available
  }
}

// ============================================
// Haptic Feedback
// ============================================

export async function triggerHaptic(
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'
): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const plugins = getPlugins();
    if (!plugins?.Haptics) return;

    const impactStyles: Record<string, string> = {
      light: 'LIGHT',
      medium: 'MEDIUM',
      heavy: 'HEAVY',
    };
    const notificationTypes: Record<string, string> = {
      success: 'SUCCESS',
      warning: 'WARNING',
      error: 'ERROR',
    };

    if (impactStyles[type]) {
      await plugins.Haptics.impact({ style: impactStyles[type] });
    } else if (notificationTypes[type]) {
      await plugins.Haptics.notification({ type: notificationTypes[type] });
    }
  } catch {
    // Not in native context or plugin not available
  }
}

// ============================================
// Biometric Authentication
// ============================================

const BIOMETRIC_CREDENTIALS_KEY = 'poa-biometric-credentials';

export interface BiometricCredentials {
  email: string;
  refreshToken: string;
}

/**
 * Check if biometric authentication is available on the device
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const plugins = getPlugins();
    if (!plugins?.NativeBiometric) return false;
    const result = await plugins.NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch {
    return false;
  }
}

/**
 * Store credentials securely in the iOS Keychain using biometric protection
 */
export async function storeBiometricCredentials(credentials: BiometricCredentials): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const plugins = getPlugins();
    if (!plugins?.NativeBiometric) return false;
    await plugins.NativeBiometric.setCredentials({
      username: credentials.email,
      password: credentials.refreshToken,
      server: BIOMETRIC_CREDENTIALS_KEY,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieve stored credentials after biometric verification
 */
export async function getBiometricCredentials(): Promise<BiometricCredentials | null> {
  if (!isNativeApp()) return null;
  try {
    const plugins = getPlugins();
    if (!plugins?.NativeBiometric) return null;

    // Prompt for biometric verification
    await plugins.NativeBiometric.verifyIdentity({
      reason: 'Melden Sie sich mit Face ID / Touch ID an',
      title: 'Biometrische Anmeldung',
      subtitle: 'Identität bestätigen',
      description: 'Verwenden Sie Face ID oder Touch ID, um sich bei POA anzumelden',
    });

    // If verification succeeded, get the stored credentials
    const credentials = await plugins.NativeBiometric.getCredentials({
      server: BIOMETRIC_CREDENTIALS_KEY,
    });

    return {
      email: credentials.username,
      refreshToken: credentials.password,
    };
  } catch {
    return null;
  }
}

/**
 * Remove stored biometric credentials
 */
export async function clearBiometricCredentials(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const plugins = getPlugins();
    if (!plugins?.NativeBiometric) return;
    await plugins.NativeBiometric.deleteCredentials({
      server: BIOMETRIC_CREDENTIALS_KEY,
    });
  } catch {
    // Credentials may not exist, safe to ignore
  }
}

/**
 * Check if biometric credentials are stored (without triggering biometric prompt)
 */
export async function hasBiometricCredentials(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const plugins = getPlugins();
    if (!plugins?.NativeBiometric) return false;
    const credentials = await plugins.NativeBiometric.getCredentials({
      server: BIOMETRIC_CREDENTIALS_KEY,
    });
    return !!credentials.username;
  } catch {
    return false;
  }
}

// ============================================
// App Lifecycle
// ============================================

/**
 * Initialize all native features. Call once when the app loads.
 */
export async function initializeNativeFeatures(): Promise<void> {
  if (!isNativeApp()) return;

  // Configure status bar
  await configureStatusBar();

  // Hide splash screen after a short delay to ensure content is ready
  setTimeout(() => {
    hideSplashScreen();
  }, 500);

  // Listen for app state changes
  try {
    const plugins = getPlugins();
    if (!plugins?.App) return;

    plugins.App.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
      if (isActive) {
        // App came to foreground - could trigger data refresh here
      }
    });

    // Handle back button (Android, but safe to register on iOS)
    plugins.App.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
      if (canGoBack) {
        window.history.back();
      }
    });
  } catch {
    // Plugin not available
  }
}
