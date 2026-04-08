/**
 * native/StretchGateNative.ts
 *
 * Unified native bridge for Streach Gate.
 * Wraps the FamilyControlsModule (modules/family-controls/) and provides
 * a single import point for all native Screen Time operations.
 *
 * In Expo Go / web builds: all methods are safe no-ops / mock returns.
 * In EAS dev/prod builds: calls through to the real Swift FamilyControlsModule.
 */

import {
  requestFamilyControlsAuth,
  getFamilyControlsStatus,
  openFamilyActivityPicker,
  applyShieldNow,
  clearShieldNow,
  enableLockSchedule,
  disableLockSchedule,
  isNativeAvailable,
} from '@/services/familyControls';

export { isNativeAvailable };

export const StretchGateNative = {
  /**
   * Requests Screen Time / FamilyControls authorization.
   * Shows the Apple system permission dialog on first call.
   * Returns true if the user granted access.
   */
  requestAuthorization: async (): Promise<boolean> => {
    const status = await requestFamilyControlsAuth();
    return status === 'authorized';
  },

  /**
   * Reads the current authorization status without prompting.
   * Returns 'authorized' | 'denied' | 'undetermined' (or 'notDetermined' alias).
   */
  getAuthorizationStatus: async (): Promise<
    'authorized' | 'denied' | 'notDetermined'
  > => {
    const status = getFamilyControlsStatus();
    if (status === 'authorized') return 'authorized';
    if (status === 'denied') return 'denied';
    return 'notDetermined';
  },

  /**
   * Opens Apple's native FamilyActivityPicker.
   * Returns a JSON string '{selected: true/false}' for compatibility.
   */
  presentAppPicker: async (): Promise<string> => {
    const selected = await openFamilyActivityPicker();
    return JSON.stringify({ selected });
  },

  /**
   * Applies the saved FamilyActivitySelection as a ManagedSettings shield.
   * Use after the user has selected apps via presentAppPicker().
   */
  applyRestrictions: (): void => {
    applyShieldNow();
  },

  /**
   * Lifts the ManagedSettings shield immediately.
   * @param durationMinutes If > 0, the DeviceActivity schedule re-applies the
   *   shield after this many minutes (handled by the monitor extension).
   *   Pass 0 to permanently remove the shield.
   */
  liftRestrictions: (durationMinutes: number): void => {
    clearShieldNow();
    if (durationMinutes > 0) {
      // Schedule a re-lock after durationMinutes via DeviceActivity.
      // Start = now, End = now + durationMinutes.
      const now = new Date();
      const end = new Date(now.getTime() + durationMinutes * 60 * 1000);
      enableLockSchedule(
        now.getHours(), now.getMinutes(),
        end.getHours(), end.getMinutes()
      ).catch(() => {});
    } else {
      disableLockSchedule();
    }
  },

  /**
   * Stores the app selection (JSON string from presentAppPicker).
   * In the Expo Modules approach, the selection is stored natively by the picker.
   * This is a compatibility shim — the selection is already persisted in App Group
   * UserDefaults when openFamilyActivityPicker() resolves.
   */
  saveSelection: (_selectionJson: string): void => {
    // Selection is already saved inside openFamilyActivityPicker() / native module.
    // No additional action needed.
  },
};

export default StretchGateNative;
