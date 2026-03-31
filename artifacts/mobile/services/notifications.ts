import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { BodyArea } from '@/constants/stretches';

export type ReminderTime = 'morning' | 'midday' | 'evening';

const REMINDER_HOURS: Record<ReminderTime, number> = {
  morning: 8,
  midday: 13,
  evening: 20,
};

const NOTIFICATION_ID_PREFIX = 'stretchgate-reminder-';

// Copy bank keyed by body area — falls back to generic copy
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
    'A gentle back stretch — then you scroll.',
    'Two minutes for your spine. You\u2019ll feel it.',
    'Back stretch first, then scroll.',
  ],
  wrists: [
    'A gentle break for your wrists.',
    'Quick wrist circles before the feed?',
    'Wrist stretch — 20 seconds, that\u2019s all.',
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
  'Move a little — then pick up the phone.',
];

function pickCopy(focusAreas: BodyArea[]): { title: string; body: string } {
  const pool: string[] = [];
  for (const area of focusAreas) {
    const lines = AREA_COPY[area];
    if (lines) pool.push(...lines);
  }
  const source = pool.length > 0 ? pool : GENERIC_COPY;
  const text = source[Math.floor(Math.random() * source.length)];
  return { title: 'StretchGate', body: text };
}

// ── Handler (call once at app startup) ────────────────────────────────
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// ── Permission helpers ────────────────────────────────────────────────
export async function getReminderPermissionStatus(): Promise<
  'undetermined' | 'granted' | 'denied'
> {
  if (Platform.OS === 'web') return 'undetermined';
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
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

// ── Schedule helpers ─────────────────────────────────────────────────
export async function cancelStretchReminderNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const ours = scheduled.filter(n =>
      n.identifier.startsWith(NOTIFICATION_ID_PREFIX)
    );
    await Promise.all(
      ours.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {
    // non-fatal
  }
}

export async function scheduleStretchReminderNotifications(
  reminderTimes: ReminderTime[],
  focusAreas: BodyArea[]
): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelStretchReminderNotifications();
  for (const time of reminderTimes) {
    const hour = REMINDER_HOURS[time];
    const { title, body } = pickCopy(focusAreas);
    await Notifications.scheduleNotificationAsync({
      identifier: `${NOTIFICATION_ID_PREFIX}${time}`,
      content: { title, body, sound: false },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
  }
}

// ── Master sync (call whenever settings change) ───────────────────────
export interface NotificationSyncSettings {
  reminderEnabled: boolean;
  selectedReminderTimes: ReminderTime[];
  focusBodyAreas: BodyArea[];
  notificationPermissionStatus: 'undetermined' | 'granted' | 'denied';
}

export async function syncStretchReminderNotifications(
  settings: NotificationSyncSettings
): Promise<void> {
  if (Platform.OS === 'web') return;
  const { reminderEnabled, selectedReminderTimes, focusBodyAreas, notificationPermissionStatus } =
    settings;

  if (!reminderEnabled || notificationPermissionStatus !== 'granted' || selectedReminderTimes.length === 0) {
    await cancelStretchReminderNotifications();
    return;
  }
  await scheduleStretchReminderNotifications(selectedReminderTimes, focusBodyAreas);
}
