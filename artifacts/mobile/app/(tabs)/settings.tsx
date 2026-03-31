import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { STRETCH_CATEGORIES, DISTRACTING_APPS, BodyArea } from "@/constants/stretches";
import { useApp } from "@/context/AppContext";
import {
  getReminderPermissionStatus,
  requestReminderPermissions,
  syncStretchReminderNotifications,
  DEFAULT_REMINDER_HOURS,
} from "@/services/notifications";
import type { ReminderTime, ReminderHourConfig } from "@/services/notifications";

// ── Time picker helpers ───────────────────────────────────────────────

interface TimeOption {
  hour: number;
  minute: number;
  label: string;
}

function buildTimeOptions(): TimeOption[] {
  const opts: TimeOption[] = [];
  for (let h = 5; h <= 23; h++) {
    for (const m of [0, 30]) {
      const ampm = h < 12 ? 'AM' : 'PM';
      const hDisplay = h % 12 || 12;
      const mDisplay = m === 0 ? '00' : '30';
      opts.push({ hour: h, minute: m, label: `${hDisplay}:${mDisplay} ${ampm}` });
    }
  }
  return opts;
}

const TIME_OPTIONS = buildTimeOptions();

function formatHourConfig(cfg: ReminderHourConfig): string {
  const ampm = cfg.hour < 12 ? 'AM' : 'PM';
  const h = cfg.hour % 12 || 12;
  const m = cfg.minute === 0 ? '00' : '30';
  return `${h}:${m} ${ampm}`;
}

// ── Sub-components ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({
  icon, iconBg, iconColor, label, sub, value, right, onPress, divider = true, danger,
}: {
  icon: string; iconBg?: string; iconColor?: string; label: string; sub?: string;
  value?: string; right?: React.ReactNode; onPress?: () => void; divider?: boolean; danger?: boolean;
}) {
  return (
    <Pressable
      style={[styles.row, !divider && { borderBottomWidth: 0 }]}
      onPress={onPress}
      disabled={!onPress && !right}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg ?? Colors.primaryMuted }]}>
        <Ionicons name={icon as any} size={16} color={iconColor ?? Colors.primary} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, danger && { color: Colors.error }]}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {right}
      {onPress && !right && (
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      )}
    </Pressable>
  );
}

function AppRow({ app, checked, onToggle, divider }: {
  app: typeof DISTRACTING_APPS[0]; checked: boolean; onToggle: () => void; divider: boolean;
}) {
  return (
    <Pressable
      style={[styles.row, !divider && { borderBottomWidth: 0 }]}
      onPress={onToggle}
    >
      <View style={[styles.rowIcon, { backgroundColor: app.color + "18" }]}>
        <Ionicons
          name={app.icon as any} size={16}
          color={app.color === "#010101" || app.color === "#FFCA00" ? Colors.text : app.color}
        />
      </View>
      <Text style={[styles.rowLabel, { flex: 1 }]}>{app.name}</Text>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked && <Ionicons name="checkmark" size={12} color={Colors.white} />}
      </View>
    </Pressable>
  );
}

// ── Time Picker Modal ─────────────────────────────────────────────────

function TimePickerModal({
  visible,
  reminderTime,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  reminderTime: ReminderTime;
  current: ReminderHourConfig;
  onSelect: (cfg: ReminderHourConfig) => void;
  onClose: () => void;
}) {
  const LABEL: Record<ReminderTime, string> = {
    morning: 'Morning',
    midday: 'Midday',
    evening: 'Evening',
  };

  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!visible) return;
    const idx = TIME_OPTIONS.findIndex(
      t => t.hour === current.hour && t.minute === current.minute
    );
    if (idx >= 0 && flatRef.current) {
      setTimeout(() => {
        flatRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0.4 });
      }, 100);
    }
  }, [visible, current]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={pick.overlay} onPress={onClose} />
      <View style={pick.sheet}>
        <View style={pick.handle} />
        <Text style={pick.title}>{LABEL[reminderTime]} reminder</Text>
        <Text style={pick.sub}>Choose when you'd like to be nudged</Text>
        <FlatList
          ref={flatRef}
          data={TIME_OPTIONS}
          keyExtractor={item => `${item.hour}:${item.minute}`}
          style={pick.list}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={() => {}}
          renderItem={({ item }) => {
            const selected = item.hour === current.hour && item.minute === current.minute;
            return (
              <Pressable
                style={[pick.option, selected && pick.optionSelected]}
                onPress={() => {
                  onSelect({ hour: item.hour, minute: item.minute });
                  onClose();
                }}
              >
                <Text style={[pick.optionText, selected && pick.optionTextSelected]}>
                  {item.label}
                </Text>
                {selected && (
                  <Ionicons name="checkmark" size={16} color={Colors.primary} />
                )}
              </Pressable>
            );
          }}
        />
        <Pressable style={pick.cancelBtn} onPress={onClose}>
          <Text style={pick.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const pick = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(26,46,34,0.45)',
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '65%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.divider,
    alignSelf: 'center', marginBottom: 16,
  },
  title: {
    fontSize: 17, fontFamily: 'DM_Sans_700Bold',
    color: Colors.text, marginBottom: 4,
  },
  sub: {
    fontSize: 12, fontFamily: 'DM_Sans_400Regular',
    color: Colors.textMuted, marginBottom: 12,
  },
  list: { maxHeight: 280 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  optionSelected: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: -6,
  },
  optionText: {
    fontSize: 15, fontFamily: 'DM_Sans_500Medium',
    color: Colors.textSecondary,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontFamily: 'DM_Sans_700Bold',
  },
  cancelBtn: {
    marginTop: 14, alignItems: 'center', paddingVertical: 10,
  },
  cancelText: {
    fontSize: 14, fontFamily: 'DM_Sans_500Medium',
    color: Colors.textMuted,
  },
});

// ── Reminder time slot row ────────────────────────────────────────────

const REMINDER_OPTS: { id: ReminderTime; label: string; icon: string }[] = [
  { id: 'morning', label: 'Morning', icon: 'cafe-outline' },
  { id: 'midday',  label: 'Midday',  icon: 'partly-sunny-outline' },
  { id: 'evening', label: 'Evening', icon: 'moon-outline' },
];

const UNLOCK_WINDOW_OPTS = [5, 10, 15, 30];
const EXPIRY_WARNING_OPTS: { value: number; label: string }[] = [
  { value: 1, label: '1 min' },
  { value: 2, label: '2 min' },
  { value: 5, label: '5 min' },
];
const STREAK_NOTIF_HOUR_OPTS: { value: number; label: string }[] = [
  { value: 18, label: '6 PM' },
  { value: 19, label: '7 PM' },
  { value: 20, label: '8 PM' },
  { value: 21, label: '9 PM' },
  { value: 22, label: '10 PM' },
];

// ── Main Settings Screen ──────────────────────────────────────────────

export default function SettingsScreen() {
  const { settings, updateSettings, clearAllData, currentStreak } = useApp();
  const [screenTimeDone, setScreenTimeDone] = useState(false);

  const [permStatus, setPermStatus] = useState<'undetermined' | 'granted' | 'denied'>(
    settings.notificationPermissionStatus
  );
  useEffect(() => {
    setPermStatus(settings.notificationPermissionStatus);
  }, [settings.notificationPermissionStatus]);

  // Time picker state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<ReminderTime>('morning');

  const openTimePicker = (rt: ReminderTime) => {
    setPickerTarget(rt);
    setPickerVisible(true);
  };

  const handleTimeSelect = async (cfg: ReminderHourConfig) => {
    const newHours = { ...settings.reminderHours, [pickerTarget]: cfg };
    await updateSettings({ reminderHours: newHours });
    await syncNotifs({ reminderHours: newHours });
  };

  const syncNotifs = useCallback(
    async (overrides: Partial<typeof settings> = {}) => {
      const merged = { ...settings, ...overrides };
      await syncStretchReminderNotifications({
        reminderEnabled: merged.reminderEnabled,
        selectedReminderTimes: merged.selectedReminderTimes,
        focusBodyAreas: merged.focusBodyAreas,
        notificationPermissionStatus: merged.notificationPermissionStatus,
        reminderHours: merged.reminderHours,
        streakNotifEnabled: merged.streakNotifEnabled,
        streakCount: currentStreak,
        streakNotifHour: merged.streakNotifHour,
      });
    },
    [settings, currentStreak]
  );

  const toggleApp = async (id: string) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    const updated = settings.lockedApps.includes(id)
      ? settings.lockedApps.filter(a => a !== id)
      : [...settings.lockedApps, id];
    await updateSettings({ lockedApps: updated });
  };

  const toggleArea = async (id: BodyArea) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    const updated = settings.focusBodyAreas.includes(id)
      ? settings.focusBodyAreas.filter(a => a !== id)
      : [...settings.focusBodyAreas, id];
    await updateSettings({ focusBodyAreas: updated });
    await syncNotifs({ focusBodyAreas: updated });
  };

  const toggleReminderMaster = async (enabled: boolean) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    if (enabled && permStatus !== 'granted') {
      const result = await requestReminderPermissions();
      setPermStatus(result);
      const next = { reminderEnabled: enabled, notificationPermissionStatus: result };
      await updateSettings(next);
      await syncNotifs(next);
      return;
    }
    await updateSettings({ reminderEnabled: enabled });
    await syncNotifs({ reminderEnabled: enabled });
  };

  const toggleReminderTime = async (id: ReminderTime) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    const current = settings.selectedReminderTimes;
    const updated = current.includes(id)
      ? current.filter(t => t !== id)
      : [...current, id];
    await updateSettings({ selectedReminderTimes: updated });
    await syncNotifs({ selectedReminderTimes: updated });
  };

  const toggleStreakNotif = async (enabled: boolean) => {
    await updateSettings({ streakNotifEnabled: enabled });
    await syncNotifs({ streakNotifEnabled: enabled });
  };

  const handleOpenNotifSettings = async () => {
    await Linking.openSettings();
    const newStatus = await getReminderPermissionStatus();
    setPermStatus(newStatus);
    await updateSettings({ notificationPermissionStatus: newStatus });
    if (newStatus === 'granted') {
      await syncNotifs({ notificationPermissionStatus: newStatus });
    }
  };

  const openScreenTime = async () => {
    if (Platform.OS === 'ios') {
      const url = 'App-Prefs:SCREEN_TIME';
      const supported = await Linking.canOpenURL(url).catch(() => false);
      if (supported) {
        await Linking.openURL(url);
        setScreenTimeDone(true);
      } else {
        await Linking.openSettings();
        setScreenTimeDone(true);
      }
    } else {
      await Linking.openSettings();
      setScreenTimeDone(true);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This permanently deletes all sessions and preferences. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const permLabel =
    permStatus === 'granted' ? 'Allowed'
    : permStatus === 'denied' ? 'Denied \u2014 tap to open Settings'
    : 'Not requested yet';
  const permColor =
    permStatus === 'granted' ? Colors.primary
    : permStatus === 'denied' ? Colors.error
    : Colors.textMuted;

  const currentHoursFor = (rt: ReminderTime): ReminderHourConfig =>
    settings.reminderHours?.[rt] ?? DEFAULT_REMINDER_HOURS[rt];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* ── Gates active ──────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380)}>
          <Section title="MINDFUL GATES">
            <Row
              icon="lock-closed-outline"
              iconBg={settings.gatesActive ? Colors.primaryMuted : Colors.bgSurface}
              iconColor={settings.gatesActive ? Colors.primary : Colors.textMuted}
              label="Gates active"
              sub={settings.gatesActive
                ? 'Stretch before opening gated apps'
                : 'Gates paused \u2014 all apps open freely'}
              divider
              right={
                <Switch
                  value={settings.gatesActive}
                  onValueChange={v => updateSettings({ gatesActive: v })}
                  trackColor={{ false: Colors.bgSurface, true: Colors.primary }}
                  thumbColor={Colors.white}
                  ios_backgroundColor={Colors.bgSurface}
                />
              }
            />
            <Text style={styles.sectionSub}>
              Choose apps you commit to stretching before opening.
            </Text>
            {DISTRACTING_APPS.map((app, i) => (
              <AppRow
                key={app.id}
                app={app}
                checked={settings.lockedApps.includes(app.id)}
                onToggle={() => toggleApp(app.id)}
                divider={i < DISTRACTING_APPS.length - 1}
              />
            ))}
          </Section>
        </Animated.View>

        {/* ── Reminders ────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(50)}>
          <Section title="REMINDERS">
            <Row
              icon="notifications-outline"
              iconBg="rgba(58,122,92,0.12)"
              label="Daily reminders"
              sub="Nudge yourself to stretch at key times"
              divider={settings.reminderEnabled}
              right={
                <Switch
                  value={settings.reminderEnabled}
                  onValueChange={toggleReminderMaster}
                  trackColor={{ false: Colors.bgSurface, true: Colors.primary }}
                  thumbColor={Colors.white}
                  ios_backgroundColor={Colors.bgSurface}
                />
              }
            />

            {settings.reminderEnabled && (
              <>
                {/* Time slot rows */}
                {REMINDER_OPTS.map((opt, i) => {
                  const on = settings.selectedReminderTimes.includes(opt.id);
                  const cfg = currentHoursFor(opt.id);
                  return (
                    <View
                      key={opt.id}
                      style={[
                        styles.reminderRow,
                        i === REMINDER_OPTS.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <Pressable
                        style={[styles.reminderToggleArea]}
                        onPress={() => toggleReminderTime(opt.id)}
                      >
                        <Ionicons
                          name={opt.icon as any}
                          size={15}
                          color={on ? Colors.primary : Colors.textMuted}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.reminderLabel, on && { color: Colors.primary }]}>
                            {opt.label}
                          </Text>
                        </View>
                        <View style={[styles.remCheck, on && styles.remCheckOn]}>
                          {on && <Ionicons name="checkmark" size={11} color={Colors.white} />}
                        </View>
                      </Pressable>
                      {on && (
                        <Pressable
                          style={styles.timeChip}
                          onPress={() => openTimePicker(opt.id)}
                        >
                          <Text style={styles.timeChipText}>{formatHourConfig(cfg)}</Text>
                          <Ionicons name="chevron-down" size={11} color={Colors.primary} />
                        </Pressable>
                      )}
                    </View>
                  );
                })}

                {/* Permission row */}
                <Pressable
                  style={styles.permRow}
                  onPress={permStatus === 'denied' ? handleOpenNotifSettings : undefined}
                  disabled={permStatus !== 'denied'}
                >
                  <View style={[styles.permDot, { backgroundColor: permColor }]} />
                  <Text style={[styles.permText, { color: permColor }]}>{permLabel}</Text>
                  {permStatus === 'denied' && (
                    <Ionicons
                      name="chevron-forward"
                      size={13}
                      color={permColor}
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </Pressable>
              </>
            )}
          </Section>
        </Animated.View>

        {/* ── Streak protection ─────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(90)}>
          <Section title="STREAK PROTECTION">
            <Row
              icon="flame-outline"
              iconBg="rgba(201,106,50,0.12)"
              iconColor={Colors.accent}
              label="Streak reminder"
              sub="Alert if you haven\u2019t stretched by evening"
              divider={settings.streakNotifEnabled}
              right={
                <Switch
                  value={settings.streakNotifEnabled}
                  onValueChange={toggleStreakNotif}
                  trackColor={{ false: Colors.bgSurface, true: Colors.primary }}
                  thumbColor={Colors.white}
                  ios_backgroundColor={Colors.bgSurface}
                />
              }
            />
            {settings.streakNotifEnabled && (
              <View style={styles.chipRowWrap}>
                <Text style={styles.chipRowLabel}>Remind me at</Text>
                <View style={styles.chipRow}>
                  {STREAK_NOTIF_HOUR_OPTS.map(opt => {
                    const on = settings.streakNotifHour === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        style={[styles.smallChip, on && styles.smallChipOn]}
                        onPress={async () => {
                          await updateSettings({ streakNotifHour: opt.value });
                          await syncNotifs({ streakNotifHour: opt.value });
                        }}
                      >
                        <Text style={[styles.smallChipText, on && styles.smallChipTextOn]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </Section>
        </Animated.View>

        {/* ── Unlock window ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(130)}>
          <Section title="UNLOCK WINDOW">
            <Text style={styles.sectionSub}>
              How long you stay unlocked after completing a stretch
            </Text>
            <View style={styles.chipRow}>
              {UNLOCK_WINDOW_OPTS.map(val => {
                const on = settings.unlockWindowMinutes === val;
                return (
                  <Pressable
                    key={val}
                    style={[styles.windowChip, on && styles.windowChipOn]}
                    onPress={() => updateSettings({ unlockWindowMinutes: val })}
                  >
                    <Text style={[styles.windowChipText, on && styles.windowChipTextOn]}>
                      {val} min
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Expiry alert sub-section */}
            <View style={[styles.subSep, { marginTop: 4 }]} />
            <Row
              icon="alarm-outline"
              iconBg="rgba(201,106,50,0.12)"
              iconColor={Colors.accent}
              label="Expiry alert"
              sub="Notify before your unlock window closes"
              divider={settings.unlockExpiryNotifEnabled}
              right={
                <Switch
                  value={settings.unlockExpiryNotifEnabled}
                  onValueChange={v => updateSettings({ unlockExpiryNotifEnabled: v })}
                  trackColor={{ false: Colors.bgSurface, true: Colors.primary }}
                  thumbColor={Colors.white}
                  ios_backgroundColor={Colors.bgSurface}
                />
              }
            />
            {settings.unlockExpiryNotifEnabled && (
              <View style={styles.chipRowWrap}>
                <Text style={styles.chipRowLabel}>Warn me</Text>
                <View style={styles.chipRow}>
                  {EXPIRY_WARNING_OPTS.map(opt => {
                    const on = settings.unlockExpiryWarningMinutes === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        style={[styles.smallChip, on && styles.smallChipOn]}
                        onPress={() => updateSettings({ unlockExpiryWarningMinutes: opt.value })}
                      >
                        <Text style={[styles.smallChipText, on && styles.smallChipTextOn]}>
                          {opt.label} before
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </Section>
        </Animated.View>

        {/* ── Focus areas ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(170)}>
          <Section title="FOCUS AREAS">
            <Text style={styles.sectionSub}>
              Stretches will be tailored to these areas. Leave empty for variety.
            </Text>
            <View style={styles.areaGrid}>
              {STRETCH_CATEGORIES.map(cat => {
                const on = settings.focusBodyAreas.includes(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    style={[styles.areaChip, on && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => toggleArea(cat.id)}
                  >
                    <Ionicons name={cat.icon as any} size={13} color={on ? '#fff' : Colors.textSecondary} />
                    <Text style={[styles.areaChipText, on && { color: '#fff' }]}>
                      {cat.label.split(' ')[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>
        </Animated.View>

        {/* ── Daily goal ────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(210)}>
          <Section title="DAILY GOAL">
            <Text style={styles.sectionSub}>Target stretches per day</Text>
            <View style={styles.chipRow}>
              {[1, 2, 3, 5, 7, 10].map(g => {
                const on = settings.dailyGoal === g;
                return (
                  <Pressable
                    key={g}
                    style={[styles.goalChip, on && styles.goalChipOn]}
                    onPress={() => updateSettings({ dailyGoal: g })}
                  >
                    <Text style={[styles.goalChipText, on && styles.goalChipTextOn]}>{g}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>
        </Animated.View>

        {/* ── Screen Time ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(250)}>
          <Section title="SCREEN TIME (OPTIONAL)">
            <View style={styles.stCard}>
              <View style={styles.stHeader}>
                <View style={[styles.stIconWrap, { backgroundColor: 'rgba(88,86,214,0.12)' }]}>
                  <Ionicons name="time-outline" size={22} color="#5856D6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stTitle}>Add a hard-lock safety net</Text>
                  <Text style={styles.stBody}>
                    StretchGate runs on the honor system. Add iOS Screen Time limits as a backup for when willpower runs low.
                  </Text>
                </View>
              </View>
              <View style={styles.stSteps}>
                {[
                  'Open iOS Settings \u2192 Screen Time',
                  'Tap \u201cApp Limits\u201d \u2192 Add Limit',
                  'Choose your gated apps \u0026 set a low daily limit',
                ].map((s, i) => (
                  <View key={i} style={styles.stStep}>
                    <View style={[styles.stStepNum, { backgroundColor: 'rgba(88,86,214,0.12)' }]}>
                      <Text style={[styles.stStepNumText, { color: '#5856D6' }]}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stStepText}>{s}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.stStatus}>
                <View style={[styles.stDot, { backgroundColor: screenTimeDone ? Colors.primary : Colors.accentLight }]} />
                <Text style={styles.stStatusText}>
                  {screenTimeDone ? 'Screen Time configured \u2014 nice safety net' : 'Optional \u2014 honor system active by default'}
                </Text>
              </View>
              <Pressable style={styles.stBtn} onPress={openScreenTime}>
                <Ionicons name="settings-outline" size={15} color={Colors.white} />
                <Text style={styles.stBtnText}>
                  {Platform.OS === 'ios' ? 'Open Screen Time Settings' : 'Open Settings'}
                </Text>
              </Pressable>
            </View>
          </Section>
        </Animated.View>

        {/* ── Preferences ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(290)}>
          <Section title="PREFERENCES">
            <Row
              icon="phone-portrait-outline"
              iconBg="rgba(88,86,214,0.12)"
              iconColor="#5856D6"
              label="Haptic feedback"
              sub="Vibration on key interactions"
              divider={false}
              right={
                <Switch
                  value={settings.hapticEnabled}
                  onValueChange={v => updateSettings({ hapticEnabled: v })}
                  trackColor={{ false: Colors.bgSurface, true: Colors.primary }}
                  thumbColor={Colors.white}
                  ios_backgroundColor={Colors.bgSurface}
                />
              }
            />
          </Section>
        </Animated.View>

        {/* ── About ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(330)}>
          <Section title="ABOUT">
            <Row
              icon="leaf-outline"
              iconBg="rgba(58,122,92,0.12)"
              label="StretchGate"
              sub="Version 1.0 \u00b7 Honor system MVP \u00b7 Hard lock coming soon"
              divider
            />
            <Row
              icon="arrow-redo-outline"
              iconBg="rgba(58,122,92,0.12)"
              label="Restart onboarding"
              onPress={() => router.replace('/onboarding')}
              divider={false}
            />
          </Section>
        </Animated.View>

        {/* ── Danger ────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(370)}>
          <Section title="DANGER ZONE">
            <Row
              icon="trash-outline"
              iconBg={Colors.errorMuted}
              iconColor={Colors.error}
              label="Reset all data"
              sub="Permanently delete sessions and settings"
              onPress={handleReset}
              danger
              divider={false}
            />
          </Section>
        </Animated.View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Time picker modal */}
      <TimePickerModal
        visible={pickerVisible}
        reminderTime={pickerTarget}
        current={currentHoursFor(pickerTarget)}
        onSelect={handleTimeSelect}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, marginBottom: 8 },
  title: { fontSize: 27, fontFamily: 'DM_Sans_700Bold', color: Colors.text, letterSpacing: -0.4 },
  section: { marginBottom: 6 },
  sectionTitle: {
    fontSize: 11, fontFamily: 'DM_Sans_600SemiBold',
    color: Colors.textMuted, letterSpacing: 0.9,
    textTransform: 'uppercase', paddingHorizontal: 20,
    marginTop: 22, marginBottom: 6,
  },
  sectionCard: {
    marginHorizontal: 20, backgroundColor: Colors.bgCard,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.divider,
    paddingHorizontal: 16,
  },
  sectionSub: {
    fontSize: 12, fontFamily: 'DM_Sans_400Regular',
    color: Colors.textMuted, lineHeight: 17,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider,
  },
  subSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginHorizontal: -16,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontFamily: 'DM_Sans_500Medium', color: Colors.text },
  rowSub: { fontSize: 11, fontFamily: 'DM_Sans_400Regular', color: Colors.textMuted, marginTop: 1 },
  rowValue: { fontSize: 14, fontFamily: 'DM_Sans_400Regular', color: Colors.textSecondary, marginRight: 4 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: Colors.textMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 12 },
  areaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 13, paddingVertical: 8,
    borderRadius: 20, backgroundColor: Colors.bgSurface,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  areaChipText: { fontSize: 13, fontFamily: 'DM_Sans_500Medium', color: Colors.textSecondary },

  // Generic chip row
  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, paddingVertical: 12,
  },
  chipRowWrap: { paddingBottom: 10 },
  chipRowLabel: {
    fontSize: 11, fontFamily: 'DM_Sans_500Medium',
    color: Colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: 8, marginTop: 4,
  },

  // Goal chips (square)
  goalChip: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  goalChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  goalChipText: { fontSize: 16, fontFamily: 'DM_Sans_700Bold', color: Colors.textSecondary },
  goalChipTextOn: { color: Colors.white },

  // Unlock window chips
  windowChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  windowChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  windowChipText: { fontSize: 14, fontFamily: 'DM_Sans_600SemiBold', color: Colors.textSecondary },
  windowChipTextOn: { color: Colors.white },

  // Small chips (streak hour, expiry warning)
  smallChip: {
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  smallChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  smallChipText: { fontSize: 13, fontFamily: 'DM_Sans_600SemiBold', color: Colors.textSecondary },
  smallChipTextOn: { color: Colors.white },

  // Reminder slot rows
  reminderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
    gap: 8,
  },
  reminderToggleArea: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  reminderLabel: {
    fontSize: 14, fontFamily: 'DM_Sans_500Medium', color: Colors.textSecondary,
  },
  remCheck: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: Colors.textMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  remCheckOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10,
  },
  timeChipText: {
    fontSize: 12, fontFamily: 'DM_Sans_700Bold', color: Colors.primary,
  },

  // Permission row
  permRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
  },
  permDot: { width: 7, height: 7, borderRadius: 4 },
  permText: { fontSize: 12, fontFamily: 'DM_Sans_500Medium' },

  // Screen Time card
  stCard: { paddingVertical: 16, gap: 14 },
  stHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stTitle: { fontSize: 15, fontFamily: 'DM_Sans_700Bold', color: Colors.text, marginBottom: 4 },
  stBody: {
    fontSize: 12, fontFamily: 'DM_Sans_400Regular',
    color: Colors.textMuted, lineHeight: 17,
  },
  stSteps: { gap: 9 },
  stStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stStepNum: {
    width: 24, height: 24, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  stStepNumText: { fontSize: 12, fontFamily: 'DM_Sans_700Bold' },
  stStepText: { fontSize: 13, fontFamily: 'DM_Sans_400Regular', color: Colors.textSecondary, flex: 1 },
  stStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.bgSurface, borderRadius: 10, padding: 10,
  },
  stDot: { width: 8, height: 8, borderRadius: 4 },
  stStatusText: { fontSize: 12, fontFamily: 'DM_Sans_500Medium', color: Colors.textSecondary },
  stBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#5856D6',
    borderRadius: 12, paddingVertical: 12,
  },
  stBtnText: { fontSize: 14, fontFamily: 'DM_Sans_700Bold', color: Colors.white },
});
