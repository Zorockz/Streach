/**
 * familyControls.ts
 * JS/TS bridge to the native FamilyControlsModule (modules/family-controls/).
 *
 * The native module is registered via Expo Modules Core as "FamilyControlsModule".
 * It is only available in a development/production build — NOT in Expo Go.
 *
 * All public functions are safe to call regardless — they no-op gracefully
 * when the native module is absent.
 */

import { Platform, NativeModules } from 'react-native';

export type FamilyControlsStatus = 'authorized' | 'denied' | 'undetermined';

// ── Native module reference ─────────────────────────────────────────────────

let _checked = false;
let _mod: NativeFamilyControlsModule | null = null;

interface NativeFamilyControlsModule {
  requestAuthorization(): Promise<string>;
  getAuthorizationStatus(): string;
  openFamilyActivityPicker(): Promise<{ selected: boolean }>;
  hasSavedSelection(): boolean;
  applyShield(): void;
  clearShield(): void;
  enableSchedule(startHour: number, startMinute: number, endHour: number, endMinute: number): Promise<boolean>;
  disableSchedule(): void;
}

function getMod(): NativeFamilyControlsModule | null {
  if (_checked) return _mod;
  _checked = true;
  try {
    _mod = (NativeModules.FamilyControlsModule as NativeFamilyControlsModule) ?? null;
  } catch {
    _mod = null;
  }
  return _mod;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * True only when the native FamilyControlsModule is linked (EAS dev/prod build).
 * Always false in Expo Go or web.
 */
export function isNativeAvailable(): boolean {
  return Platform.OS === 'ios' && getMod() !== null;
}

/**
 * Requests Apple Screen Time / FamilyControls authorization.
 * Shows the system permission dialog on first call.
 * Returns 'authorized' | 'denied' | 'undetermined'.
 */
export async function requestFamilyControlsAuth(): Promise<FamilyControlsStatus> {
  if (Platform.OS !== 'ios') return 'denied';
  const mod = getMod();
  if (!mod?.requestAuthorization) return 'undetermined';
  try {
    const result = await mod.requestAuthorization();
    if (result === 'authorized') return 'authorized';
    if (result === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'denied';
  }
}

/**
 * Reads the current Screen Time authorization status synchronously.
 */
export function getFamilyControlsStatus(): FamilyControlsStatus {
  if (Platform.OS !== 'ios') return 'denied';
  const mod = getMod();
  if (!mod?.getAuthorizationStatus) return 'undetermined';
  try {
    const result = mod.getAuthorizationStatus();
    if (result === 'authorized') return 'authorized';
    if (result === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

/**
 * Opens Apple's native FamilyActivityPicker so the user can select
 * which apps and categories to block. The selection is stored in the
 * App Group UserDefaults and is accessible by the DeviceActivity Monitor extension.
 *
 * Returns true if the user saved a selection, false if they cancelled.
 */
export async function openFamilyActivityPicker(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  const mod = getMod();
  if (!mod?.openFamilyActivityPicker) return false;
  try {
    const result = await mod.openFamilyActivityPicker();
    return result.selected;
  } catch {
    return false;
  }
}

/**
 * Returns true if the user has previously saved a FamilyActivitySelection.
 */
export function hasSavedAppSelection(): boolean {
  if (Platform.OS !== 'ios') return false;
  const mod = getMod();
  if (!mod?.hasSavedSelection) return false;
  try {
    return mod.hasSavedSelection();
  } catch {
    return false;
  }
}

/**
 * Applies the saved FamilyActivitySelection as a ManagedSettings shield immediately.
 * Use this for manual locking outside the scheduled window.
 */
export function applyShieldNow(): void {
  if (Platform.OS !== 'ios') return;
  const mod = getMod();
  if (!mod?.applyShield) return;
  try { mod.applyShield(); } catch {}
}

/**
 * Removes all active ManagedSettings shields immediately.
 */
export function clearShieldNow(): void {
  if (Platform.OS !== 'ios') return;
  const mod = getMod();
  if (!mod?.clearShield) return;
  try { mod.clearShield(); } catch {}
}

/**
 * Starts a repeating DeviceActivity schedule.
 * The DeviceActivity Monitor extension automatically shields/unshields
 * the selected apps at the start/end of the window — even when the app is closed.
 *
 * @param startHour   24h lock start hour  (e.g. 22 for 10 PM)
 * @param startMinute Lock start minute
 * @param endHour     24h lock end hour    (e.g. 8 for 8 AM)
 * @param endMinute   Lock end minute
 */
export async function enableLockSchedule(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  const mod = getMod();
  if (!mod?.enableSchedule) return false;
  try {
    return await mod.enableSchedule(startHour, startMinute, endHour, endMinute);
  } catch {
    return false;
  }
}

/**
 * Stops the DeviceActivity schedule and removes all shields.
 */
export function disableLockSchedule(): void {
  if (Platform.OS !== 'ios') return;
  const mod = getMod();
  if (!mod?.disableSchedule) return;
  try {
    mod.disableSchedule();
    mod.clearShield?.();
  } catch {}
}
