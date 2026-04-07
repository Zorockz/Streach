import { NativeModules, Platform } from 'react-native';

// The native module is registered as FamilyControlsModule via Expo Modules.
// It is only available in a dev/production build — not in Expo Go.
const mod: FamilyControlsNativeModule | null =
  Platform.OS === 'ios'
    ? (NativeModules.FamilyControlsModule ?? null)
    : null;

interface FamilyControlsNativeModule {
  requestAuthorization(): Promise<string>;
  getAuthorizationStatus(): string;
  openFamilyActivityPicker(): Promise<{ selected: boolean }>;
  hasSavedSelection(): boolean;
  applyShield(): void;
  clearShield(): void;
  enableSchedule(startHour: number, startMinute: number, endHour: number, endMinute: number): Promise<boolean>;
  disableSchedule(): void;
}

export type AuthorizationStatus = 'authorized' | 'denied' | 'undetermined';

export function isNativeAvailable(): boolean {
  return mod !== null;
}

export async function requestAuthorization(): Promise<AuthorizationStatus> {
  if (!mod) return 'undetermined';
  try {
    const result = await mod.requestAuthorization();
    if (result === 'authorized') return 'authorized';
    if (result === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'denied';
  }
}

export function getAuthorizationStatus(): AuthorizationStatus {
  if (!mod) return 'undetermined';
  try {
    const result = mod.getAuthorizationStatus();
    if (result === 'authorized') return 'authorized';
    if (result === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

export async function openFamilyActivityPicker(): Promise<boolean> {
  if (!mod) return false;
  try {
    const result = await mod.openFamilyActivityPicker();
    return result.selected;
  } catch {
    return false;
  }
}

export function hasSavedSelection(): boolean {
  if (!mod) return false;
  try {
    return mod.hasSavedSelection();
  } catch {
    return false;
  }
}

export function applyShield(): void {
  if (!mod) return;
  try { mod.applyShield(); } catch {}
}

export function clearShield(): void {
  if (!mod) return;
  try { mod.clearShield(); } catch {}
}

export async function enableSchedule(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number
): Promise<boolean> {
  if (!mod) return false;
  try {
    return await mod.enableSchedule(startHour, startMinute, endHour, endMinute);
  } catch {
    return false;
  }
}

export function disableSchedule(): void {
  if (!mod) return;
  try { mod.disableSchedule(); } catch {}
}
