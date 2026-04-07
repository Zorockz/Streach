import { Platform } from 'react-native';

export type FamilyControlsStatus = 'authorized' | 'denied' | 'undetermined';

let _nativeModChecked = false;
let _nativeMod: any = null;

function getNativeMod() {
  if (_nativeModChecked) return _nativeMod;
  _nativeModChecked = true;
  try {
    _nativeMod = require('react-native').NativeModules.FamilyControlsModule ?? null;
  } catch {
    _nativeMod = null;
  }
  return _nativeMod;
}

/** True only when the native FamilyControlsModule bridge is linked (dev build). */
export function isNativeAvailable(): boolean {
  return Platform.OS === 'ios' && getNativeMod() !== null;
}

/**
 * Requests Screen Time / Family Controls authorization.
 * Requires a dev build with the native FamilyControlsModule linked.
 * Returns 'undetermined' when the native module is absent (Expo Go / web).
 */
export async function requestFamilyControlsAuth(): Promise<FamilyControlsStatus> {
  if (Platform.OS !== 'ios') return 'denied';
  const mod = getNativeMod();
  if (!mod?.requestAuthorization) {
    // Native module not linked — dev build required, cannot prompt the user.
    return 'undetermined';
  }
  try {
    const result: string = await mod.requestAuthorization();
    if (result === 'authorized') return 'authorized';
    if (result === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'denied';
  }
}

/**
 * Reads the current Screen Time authorization status.
 * Returns 'undetermined' when the native module is absent.
 */
export async function getFamilyControlsStatus(): Promise<FamilyControlsStatus> {
  if (Platform.OS !== 'ios') return 'denied';
  const mod = getNativeMod();
  if (!mod?.getAuthorizationStatus) return 'undetermined';
  try {
    const result: string = await mod.getAuthorizationStatus();
    if (result === 'authorized') return 'authorized';
    if (result === 'denied') return 'denied';
  } catch {}
  return 'undetermined';
}

/**
 * Applies a ManagedSettings shield to the supplied app bundle identifiers.
 * No-op when native module is absent.
 */
export async function shieldApps(bundleIds: string[]): Promise<void> {
  if (Platform.OS !== 'ios') return;
  const mod = getNativeMod();
  if (!mod?.shieldApps) return;
  try {
    await mod.shieldApps(bundleIds);
  } catch {}
}

/**
 * Removes any active ManagedSettings shield.
 * No-op when native module is absent.
 */
export async function clearShield(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  const mod = getNativeMod();
  if (!mod?.clearShield) return;
  try {
    await mod.clearShield();
  } catch {}
}
