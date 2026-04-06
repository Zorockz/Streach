import { NativeModules } from 'react-native';

let SuperwallModule: any = null;
let PaywallPresentationHandlerClass: any = null;

try {
  const mod = require('@superwall/react-native-superwall');
  SuperwallModule = mod.default;
  PaywallPresentationHandlerClass = mod.PaywallPresentationHandler;
} catch {
  // Not linked — running in Expo Go or unlinked dev build
}

const SUPERWALL_API_KEY = process.env.EXPO_PUBLIC_SUPERWALL_API_KEY ?? '';

let _configured = false;

function isNativeAvailable(): boolean {
  return !!SuperwallModule && !!NativeModules.SuperwallReactNative;
}

export async function initSuperwall(): Promise<void> {
  if (_configured) return;
  if (!isNativeAvailable()) {
    console.warn('[Superwall] Native module not linked — skipping (Expo Go / dev)');
    return;
  }
  if (!SUPERWALL_API_KEY) {
    console.warn('[Superwall] No API key found. Set EXPO_PUBLIC_SUPERWALL_API_KEY.');
    return;
  }
  try {
    await SuperwallModule.configure({ apiKey: SUPERWALL_API_KEY });
    _configured = true;
  } catch (err) {
    console.warn('[Superwall] configure error:', err);
  }
}

export function triggerPaywall(placement: string, onReady: () => void): void {
  if (!isNativeAvailable() || !_configured) {
    onReady();
    return;
  }

  const handler = new PaywallPresentationHandlerClass();

  const done = (() => {
    let called = false;
    return () => {
      if (!called) {
        called = true;
        onReady();
      }
    };
  })();

  handler.onSkip(() => done());
  handler.onDismiss(() => done());
  handler.onError(() => done());

  SuperwallModule.shared
    .register({ placement, handler, feature: () => done() })
    .catch(() => done());
}
