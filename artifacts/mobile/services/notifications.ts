import { Platform } from 'react-native';
import { BodyArea } from '@/constants/stretches';

export type ReminderTime = 'morning' | 'midday' | 'evening';

export interface ReminderHourConfig {
  hour: number;
  minute: number;
}

export const DEFAULT_REMINDER_HOURS: Record<ReminderTime, ReminderHourConfig> = {
  morning: { hour: 8, minute: 0 },
  midday:  { hour: 13, minute: 0 },
  evening: { hour: 20, minute: 0 },
};

// Notification identifier namespaces
const REMINDER_PREFIX = 'stretchgate-reminder-';
const EXPIRY_PREFIX   = 'stretchgate-expiry-';
const STREAK_ID       = 'stretchgate-streak';

// ── Lazy-load expo-notifications so Expo Go doesn't crash at module load ──────
type NotifModule = typeof import('expo-notifications');

let _notif: NotifModule | null = null;
let _notifChecked = false;

function getNotif(): NotifModule | null {
  if (_notifChecked) return _notif;
  _notifChecked = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _notif = require('expo-notifications') as NotifModule;
  } catch {
    _notif = null;
  }
  return _notif;
}

// ── Copy bank ────────────────────────────────────────────────────────
const AREA_COPY: Partial<Record<BodyArea, string[]>> = {
  neck: [
    'Quick neck reset before the next scroll?',
    'A 30-second chin tuck does wonders.',
    'Neck stretch first, then scroll.',
  ],
  shoulders: [
    'Take 30 seconds for your shoulders.',
    'Shoulder rolls before you open the app?',
    'Your shoulders could use a moment.',
  ],
  back: [
    'A gentle back stretch \u2014 then you scroll.',
    'Two minutes for your spine. You\u2019ll feel it.',
    'Back stretch first, then scroll.',
  ],
  wrists: [
    'A gentle break for your wrists.',
    'Quick wrist circles before the feed?',
    'Wrist stretch \u2014 20 seconds, that\u2019s all.',
  ],
  hips: [
    'Hip opener first, feed after.',
    'Stand up, stretch your hips, then sit back.',
    'A quick hip flexor break?',
  ],
  full: [
    'Stretch first, then scroll.',
    'One full-body stretch before you scroll?',
    'Move a little. Then open the app.',
  ],
};

const GENERIC_COPY = [
  'Stretch first, then scroll.',
  'Quick neck reset before the next scroll?',
  'Take 30 seconds for your shoulders.',
  'A gentle break for your wrists.',
  'One stretch before you open the app?',
  'Move a little \u2014 then pick up the phone.',
];

const STREAK_COPY = [
  "Don\u2019t break the streak \u2014 one quick stretch?",
  "Still time to stretch today. Don\u2019t lose your streak.",
  "Your streak is waiting. 30 seconds is all it takes.",
  "One move before midnight keeps the streak alive.",
];

function pickCopy(focusAreas: BodyArea[]): string {
  const pool: string[] = [];
  for (const area of focusAreas) {
    const lines = AREA_COPY[area];
    if (lines) pool.push(...lines);
  }
  const source = pool.length > 0 ? pool : GENERIC_COPY;
  return source[Math.floor(Math.random() * source.length)];
}

// ── Handler (call once at app startup) ────────────────────────────────
export function configureNotificationHandler(): void {
  const Notifications = getNotif();
  if (!Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch { /* non-fatal in Expo Go */ }
}

// ── Permission helpers ────────────────────────────────────────────────
export async function getReminderPermissionStatus(): Promise<
  'undetermined' | 'granted' | 'denied'
> {
  if (Platform.OS === 'web') return 'undetermined';
  const Notifications = getNotif();
  if (!Notifications) return 'undetermined';
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

export async function requestReminderPermissions(): Promise<
  'granted' | 'denied'
> {
  if (Platform.OS === 'web') return 'denied';
  const Notifications = getNotif();
  if (!Notifications) return 'denied';
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

// ── Daily reminder scheduling ─────────────────────────────────────────
export async function cancelStretchReminderNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = getNotif();
  if (!Notifications) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter(n => n.identifier.startsWith(REMINDER_PREFIX))
        .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch { /* non-fatal */ }
}

export async function scheduleStretchReminderNotifications(
  reminderTimes: ReminderTime[],
  focusAreas: BodyArea[],
  customHours: Partial<Record<ReminderTime, ReminderHourConfig>> = {}
): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = getNotif();
  if (!Notifications) return;
  await cancelStretchReminderNotifications();
  for (const time of reminderTimes) {
    const cfg = customHours[time] ?? DEFAULT_REMINDER_HOURS[time];
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_PREFIX}${time}`,
        content: {
          title: 'StretchGate',
          body: pickCopy(focusAreas),
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: cfg.hour,
          minute: cfg.minute,
        },
      });
    } catch { /* non-fatal */ }
  }
}

// ── Streak protection notification ────────────────────────────────────
export async function scheduleStreakProtectionNotification(
  streakCount: number,
  hour: number = 21,
  minute: number = 0
): Promise<void> {
  if (Platform.OS === 'web' || streakCount <= 0) return;
  const Notifications = getNotif();
  if (!Notifications) return;
  try {
    await cancelStreakProtectionNotification();
    const body = STREAK_COPY[Math.floor(Math.random() * STREAK_COPY.length)];
    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_ID,
      content: {
        title: `\uD83D\uDD25 ${streakCount}-day streak`,
        body,
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch { /* non-fatal */ }
}

export async function cancelStreakProtectionNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = getNotif();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(STREAK_ID);
  } catch { /* non-fatal */ }
}

// ── Unlock expiry cleanup (cancels any lingering alerts from previous versions) ─

export async function cancelAllUnlockExpiryAlerts(): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = getNotif();
  if (!Notifications) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter(n => n.identifier.startsWith(EXPIRY_PREFIX))
        .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch { /* non-fatal */ }
}

// ── Master sync ───────────────────────────────────────────────────────
export interface NotificationSyncSettings {
  reminderEnabled: boolean;
  selectedReminderTimes: ReminderTime[];
  focusBodyAreas: BodyArea[];
  notificationPermissionStatus: 'undetermined' | 'granted' | 'denied';
  reminderHours?: Partial<Record<ReminderTime, ReminderHourConfig>>;
  streakNotifEnabled?: boolean;
  streakCount?: number;
  streakNotifHour?: number;
}

export async function syncStretchReminderNotifications(
  s: NotificationSyncSettings
): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!getNotif()) return;

  if (!s.reminderEnabled || s.notificationPermissionStatus !== 'granted' || s.selectedReminderTimes.length === 0) {
    await cancelStretchReminderNotifications();
  } else {
    await scheduleStretchReminderNotifications(
      s.selectedReminderTimes,
      s.focusBodyAreas,
      s.reminderHours
    );
  }

  if (s.streakNotifEnabled && s.notificationPermissionStatus === 'granted' && (s.streakCount ?? 0) > 0) {
    await scheduleStreakProtectionNotification(s.streakCount ?? 0, s.streakNotifHour ?? 21);
  } else {
    await cancelStreakProtectionNotification();
  }
}

// ── Convenience adapters used by AppContext ─────────────────────────────────

/**
 * Schedule a single daily reminder at the specified time.
 * Used when the user changes reminderEnabled or reminderTime in settings.
 */
export async function scheduleDailyReminder(
  time: { hour: number; minute: number },
  streakCount: number = 0
): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = getNotif();
  if (!Notifications) return;
  const body = streakCount > 0
    ? `Day ${streakCount + 1} — time for your stretch! 🌿`
    : 'Time for your daily stretch! 🌿';
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Streach Gate', body, sound: true },
    trigger: { type: 'calendar' as any, hour: time.hour, minute: time.minute, repeats: true },
  });
}

/**
 * Re-schedule a streak protection alert.
 * Alias of scheduleStreakProtectionNotification for AppContext use.
 */
export async function scheduleStreakAlert(streakCount: number): Promise<void> {
  if (streakCount <= 0) return;
  await scheduleStreakProtectionNotification(streakCount, 21);
}

/**
 * Cancel ALL scheduled notifications (stretch + streak).
 */
export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = getNotif();
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch { /* non-fatal */ }
}

/**
 * Called by AppContext after a session completes.
 * Reschedules streak notifications with the updated streak count.
 */
export async function handleSessionCompleted(newStreakCount: number): Promise<void> {
  if (newStreakCount > 0) {
    await scheduleStreakProtectionNotification(newStreakCount, 21).catch(() => {});
  }
}
