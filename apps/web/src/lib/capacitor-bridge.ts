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

interface CapacitorGlobal {
  Plugins?: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>;
  getPlatform?: () => string;
  platform?: string;
}

function getCapacitor(): CapacitorGlobal | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

function getPlugin(name: string): Record<string, (...args: unknown[]) => Promise<unknown>> | undefined {
  return getCapacitor()?.Plugins?.[name];
}

// Detect if running inside Capacitor native shell
export function isNativeApp(): boolean {
  return !!getCapacitor();
}

// Detect specifically iOS native
export function isIOSNativeApp(): boolean {
  const cap = getCapacitor();
  if (!cap) return false;
  return cap.getPlatform?.() === 'ios' || cap.platform === 'ios';
}

// ============================================
// Splash Screen
// ============================================

let splashScreenHidden = false;

export async function hideSplashScreen(): Promise<void> {
  if (!isNativeApp() || splashScreenHidden) return;
  try {
    const plugin = getPlugin('SplashScreen');
    if (!plugin) return;
    await plugin.hide({ fadeOutDuration: 300 });
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
    const plugin = getPlugin('StatusBar');
    if (!plugin) return;
    await plugin.setStyle({ style: 'DARK' });
    await plugin.setOverlaysWebView({ overlay: false });
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
    const plugin = getPlugin('Haptics');
    if (!plugin) return;

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
      await plugin.impact({ style: impactStyles[type] });
    } else if (notificationTypes[type]) {
      await plugin.notification({ type: notificationTypes[type] });
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
    const plugin = getPlugin('NativeBiometric');
    if (!plugin) return false;
    const result = await plugin.isAvailable() as { isAvailable: boolean };
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
    const plugin = getPlugin('NativeBiometric');
    if (!plugin) return false;
    await plugin.setCredentials({
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
    const plugin = getPlugin('NativeBiometric');
    if (!plugin) return null;

    // Prompt for biometric verification
    await plugin.verifyIdentity({
      reason: 'Melden Sie sich mit Face ID / Touch ID an',
      title: 'Biometrische Anmeldung',
      subtitle: 'Identität bestätigen',
      description: 'Verwenden Sie Face ID oder Touch ID, um sich bei POA anzumelden',
    });

    // If verification succeeded, get the stored credentials
    const credentials = await plugin.getCredentials({
      server: BIOMETRIC_CREDENTIALS_KEY,
    }) as { username: string; password: string };

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
    const plugin = getPlugin('NativeBiometric');
    if (!plugin) return;
    await plugin.deleteCredentials({
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
    const plugin = getPlugin('NativeBiometric');
    if (!plugin) return false;
    const credentials = await plugin.getCredentials({
      server: BIOMETRIC_CREDENTIALS_KEY,
    }) as { username: string };
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
    const plugin = getPlugin('App');
    if (!plugin) return;

    await plugin.addListener('appStateChange', (state: unknown) => {
      const s = state as { isActive?: boolean };
      if (s.isActive) {
        // App came to foreground - could trigger data refresh here
      }
    });

    // Handle back button (Android, but safe to register on iOS)
    await plugin.addListener('backButton', (event: unknown) => {
      const e = event as { canGoBack?: boolean };
      if (e.canGoBack) {
        window.history.back();
      }
    });
  } catch {
    // Plugin not available
  }
}
