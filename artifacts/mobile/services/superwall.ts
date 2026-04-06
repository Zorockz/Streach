import Superwall, { PaywallPresentationHandler } from '@superwall/react-native-superwall';
import { NativeModules } from 'react-native';

const SUPERWALL_API_KEY = process.env.EXPO_PUBLIC_SUPERWALL_API_KEY ?? '';

let _configured = false;

function isNativeAvailable(): boolean {
  return !!NativeModules.SuperwallReactNative;
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
    await Superwall.configure({ apiKey: SUPERWALL_API_KEY });
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

  const handler = new PaywallPresentationHandler();

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

  Superwall.shared
    .register({ placement, handler, feature: () => done() })
    .catch(() => done());
}
