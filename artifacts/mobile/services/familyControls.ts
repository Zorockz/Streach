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

export async function requestFamilyControlsAuth(): Promise<FamilyControlsStatus> {
  if (Platform.OS !== 'ios') return 'denied';
  const mod = getNativeMod();
  if (mod?.requestAuthorization) {
    try {
      const result: string = await mod.requestAuthorization();
      if (result === 'authorized') return 'authorized';
      if (result === 'denied') return 'denied';
      return 'undetermined';
    } catch {
      return 'denied';
    }
  }
  // Dev/stub: simulate a successful auth request
  await new Promise(res => setTimeout(res, 800));
  return 'authorized';
}

export async function getFamilyControlsStatus(): Promise<FamilyControlsStatus> {
  if (Platform.OS !== 'ios') return 'denied';
  const mod = getNativeMod();
  if (mod?.getAuthorizationStatus) {
    try {
      const result: string = await mod.getAuthorizationStatus();
      if (result === 'authorized') return 'authorized';
      if (result === 'denied') return 'denied';
    } catch {}
  }
  return 'undetermined';
}
