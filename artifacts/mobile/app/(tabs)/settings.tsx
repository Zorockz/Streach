import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
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
} from "@/services/notifications";
import type { ReminderTime } from "@/services/notifications";

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

const REMINDER_OPTS: { id: ReminderTime; label: string; icon: string; sub: string }[] = [
  { id: "morning", label: "Morning", icon: "cafe-outline", sub: "8:00 AM" },
  { id: "midday",  label: "Midday",  icon: "partly-sunny-outline", sub: "1:00 PM" },
  { id: "evening", label: "Evening", icon: "moon-outline", sub: "8:00 PM" },
];

const UNLOCK_WINDOW_OPTS: { value: number; label: string }[] = [
  { value: 5,  label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
];

export default function SettingsScreen() {
  const { settings, updateSettings, clearAllData } = useApp();
  const [screenTimeDone, setScreenTimeDone] = useState(false);

  // Mirror notification permission status locally so UI updates after user acts
  const [permStatus, setPermStatus] = useState<'undetermined' | 'granted' | 'denied'>(
    settings.notificationPermissionStatus
  );

  // Sync local permStatus whenever settings change (e.g. after onboarding)
  useEffect(() => {
    setPermStatus(settings.notificationPermissionStatus);
  }, [settings.notificationPermissionStatus]);

  const syncNotifs = useCallback(
    async (overrides: Partial<typeof settings> = {}) => {
      const merged = { ...settings, ...overrides };
      await syncStretchReminderNotifications({
        reminderEnabled: merged.reminderEnabled,
        selectedReminderTimes: merged.selectedReminderTimes,
        focusBodyAreas: merged.focusBodyAreas,
        notificationPermissionStatus: merged.notificationPermissionStatus,
      });
    },
    [settings]
  );

  const toggleApp = async (id: string) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    const updated = settings.lockedApps.includes(id)
      ? settings.lockedApps.filter(a => a !== id)
      : [...settings.lockedApps, id];
    await updateSettings({ lockedApps: updated });
  };

  const toggleArea = async (id: BodyArea) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    const updated = settings.focusBodyAreas.includes(id)
      ? settings.focusBodyAreas.filter(a => a !== id)
      : [...settings.focusBodyAreas, id];
    await updateSettings({ focusBodyAreas: updated });
    await syncNotifs({ focusBodyAreas: updated });
  };

  const toggleReminderMaster = async (enabled: boolean) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();

    // If turning ON and permission is not granted, request it first
    if (enabled && permStatus !== 'granted') {
      const result = await requestReminderPermissions();
      setPermStatus(result);
      await updateSettings({ reminderEnabled: enabled, notificationPermissionStatus: result });
      await syncNotifs({ reminderEnabled: enabled, notificationPermissionStatus: result });
      return;
    }

    await updateSettings({ reminderEnabled: enabled });
    await syncNotifs({ reminderEnabled: enabled });
  };

  const toggleReminderTime = async (id: ReminderTime) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    const current = settings.selectedReminderTimes;
    const updated = current.includes(id)
      ? current.filter(t => t !== id)
      : [...current, id];
    await updateSettings({ selectedReminderTimes: updated });
    await syncNotifs({ selectedReminderTimes: updated });
  };

  const handleOpenNotifSettings = async () => {
    await Linking.openSettings();
    // Re-check permission after user returns
    const newStatus = await getReminderPermissionStatus();
    setPermStatus(newStatus);
    await updateSettings({ notificationPermissionStatus: newStatus });
    if (newStatus === 'granted') {
      await syncNotifs({ notificationPermissionStatus: newStatus });
    }
  };

  const openScreenTime = async () => {
    if (Platform.OS === "ios") {
      const url = "App-Prefs:SCREEN_TIME";
      const supported = await Linking.canOpenURL(url).catch(() => false);
      if (supported) {
        await Linking.openURL(url);
        setScreenTimeDone(true);
      } else {
        await Linking.openSettings();
        setScreenTimeDone(true);
      }
    } else if (Platform.OS === "android") {
      await Linking.openSettings();
      setScreenTimeDone(true);
    } else {
      setScreenTimeDone(true);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset All Data",
      "This permanently deletes all sessions and preferences. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const permLabel =
    permStatus === "granted" ? "Allowed"
    : permStatus === "denied" ? "Denied \u2014 tap to open Settings"
    : "Not requested yet";

  const permColor =
    permStatus === "granted" ? Colors.primary
    : permStatus === "denied" ? Colors.error
    : Colors.textMuted;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* ── Reminders ────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380)}>
          <Section title="REMINDERS">
            <Row
              icon="notifications-outline"
              iconBg="rgba(58,122,92,0.12)"
              label="Daily reminders"
              sub="Get nudged to stretch at key times"
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
                {/* Time chips */}
                <View style={styles.reminderChipsWrap}>
                  {REMINDER_OPTS.map(opt => {
                    const on = settings.selectedReminderTimes.includes(opt.id);
                    return (
                      <Pressable
                        key={opt.id}
                        style={[styles.reminderChip, on && styles.reminderChipOn]}
                        onPress={() => toggleReminderTime(opt.id)}
                      >
                        <Ionicons
                          name={opt.icon as any}
                          size={14}
                          color={on ? Colors.white : Colors.textSecondary}
                        />
                        <View>
                          <Text style={[styles.reminderChipLabel, on && { color: Colors.white }]}>
                            {opt.label}
                          </Text>
                          <Text style={[styles.reminderChipSub, on && { color: "rgba(255,255,255,0.65)" }]}>
                            {opt.sub}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Permission status */}
                <Pressable
                  style={styles.permRow}
                  onPress={permStatus === "denied" ? handleOpenNotifSettings : undefined}
                  disabled={permStatus !== "denied"}
                >
                  <View style={[styles.permDot, { backgroundColor: permColor }]} />
                  <Text style={[styles.permText, { color: permColor }]}>{permLabel}</Text>
                  {permStatus === "denied" && (
                    <Ionicons name="chevron-forward" size={13} color={permColor} style={{ marginLeft: "auto" }} />
                  )}
                </Pressable>
              </>
            )}
          </Section>
        </Animated.View>

        {/* ── Unlock window ─────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(40)}>
          <Section title="UNLOCK WINDOW">
            <Text style={styles.sectionSub}>
              How long you stay unlocked after completing a stretch
            </Text>
            <View style={styles.goalRow}>
              {UNLOCK_WINDOW_OPTS.map(opt => {
                const on = settings.unlockWindowMinutes === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.windowChip, on && styles.windowChipOn]}
                    onPress={() => updateSettings({ unlockWindowMinutes: opt.value })}
                  >
                    <Text style={[styles.windowChipText, on && styles.windowChipTextOn]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>
        </Animated.View>

        {/* ── Screen Time ────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(80)}>
          <Section title="SCREEN TIME">
            <View style={styles.stCard}>
              <View style={styles.stHeader}>
                <View style={[styles.stIconWrap, { backgroundColor: "rgba(88,86,214,0.12)" }]}>
                  <Ionicons name="time-outline" size={22} color="#5856D6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stTitle}>Add a safety net</Text>
                  <Text style={styles.stBody}>
                    StretchGate runs on the honor system. For a hard limit, set an iOS Screen Time app limit as a backup.
                  </Text>
                </View>
              </View>
              <View style={styles.stSteps}>
                {[
                  "Open iOS Settings \u2192 Screen Time",
                  'Tap \u201cApp Limits\u201d \u2192 Add Limit',
                  "Choose your gated apps \u0026 set a low daily limit",
                ].map((s, i) => (
                  <View key={i} style={styles.stStep}>
                    <View style={[styles.stStepNum, { backgroundColor: "rgba(88,86,214,0.12)" }]}>
                      <Text style={[styles.stStepNumText, { color: "#5856D6" }]}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stStepText}>{s}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.stStatus}>
                <View style={[styles.stDot, { backgroundColor: screenTimeDone ? Colors.primary : Colors.accentLight }]} />
                <Text style={styles.stStatusText}>
                  {screenTimeDone ? "Screen Time set up \u2014 nice safety net" : "Optional \u2014 honor system active by default"}
                </Text>
              </View>
              <Pressable style={styles.stBtn} onPress={openScreenTime}>
                <Ionicons name="settings-outline" size={15} color={Colors.white} />
                <Text style={styles.stBtnText}>
                  {Platform.OS === "ios" ? "Open Screen Time Settings" : "Open Settings"}
                </Text>
              </Pressable>
            </View>
          </Section>
        </Animated.View>

        {/* ── Mindful gates ────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(120)}>
          <Section title="MINDFUL GATES">
            <Text style={styles.sectionSub}>
              You commit to stretching before opening these apps.
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

        {/* ── Focus areas ──────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(160)}>
          <Section title="FOCUS AREAS">
            <Text style={styles.sectionSub}>
              We'll tailor stretches to these areas. Leave empty for variety.
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
                    <Ionicons name={cat.icon as any} size={13} color={on ? "#fff" : Colors.textSecondary} />
                    <Text style={[styles.areaChipText, on && { color: "#fff" }]}>
                      {cat.label.split(" ")[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>
        </Animated.View>

        {/* ── Daily goal ───────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(200)}>
          <Section title="DAILY GOAL">
            <Text style={styles.sectionSub}>Target number of stretches per day</Text>
            <View style={styles.goalRow}>
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

        {/* ── Preferences ──────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(240)}>
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

        {/* ── About ────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(280)}>
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
              onPress={() => router.replace("/onboarding")}
              divider={false}
            />
          </Section>
        </Animated.View>

        {/* ── Danger ───────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380).delay(320)}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, marginBottom: 8 },
  title: { fontSize: 27, fontFamily: "DM_Sans_700Bold", color: Colors.text, letterSpacing: -0.4 },
  section: { marginBottom: 6 },
  sectionTitle: {
    fontSize: 11, fontFamily: "DM_Sans_600SemiBold",
    color: Colors.textMuted, letterSpacing: 0.9,
    textTransform: "uppercase", paddingHorizontal: 20,
    marginTop: 22, marginBottom: 6,
  },
  sectionCard: {
    marginHorizontal: 20, backgroundColor: Colors.bgCard,
    borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: Colors.divider,
    paddingHorizontal: 16,
  },
  sectionSub: {
    fontSize: 12, fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted, lineHeight: 17,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row", alignItems: "center",
    gap: 12, paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontFamily: "DM_Sans_500Medium", color: Colors.text },
  rowSub: { fontSize: 11, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted, marginTop: 1 },
  rowValue: { fontSize: 14, fontFamily: "DM_Sans_400Regular", color: Colors.textSecondary, marginRight: 4 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: Colors.textMuted,
    alignItems: "center", justifyContent: "center",
  },
  checkboxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  areaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 12 },
  areaChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 13, paddingVertical: 8,
    borderRadius: 20, backgroundColor: Colors.bgSurface,
    borderWidth: 1.5, borderColor: "transparent",
  },
  areaChipText: { fontSize: 13, fontFamily: "DM_Sans_500Medium", color: Colors.textSecondary },
  goalRow: { flexDirection: "row", gap: 8, paddingVertical: 12, flexWrap: "wrap" },
  goalChip: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: Colors.bgSurface, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "transparent",
  },
  goalChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  goalChipText: { fontSize: 16, fontFamily: "DM_Sans_700Bold", color: Colors.textSecondary },
  goalChipTextOn: { color: Colors.white },

  // Reminders
  reminderChipsWrap: {
    paddingVertical: 12, gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider,
  },
  reminderChip: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, backgroundColor: Colors.bgSurface,
    borderWidth: 1.5, borderColor: "transparent",
  },
  reminderChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  reminderChipLabel: {
    fontSize: 14, fontFamily: "DM_Sans_600SemiBold",
    color: Colors.text,
  },
  reminderChipSub: {
    fontSize: 11, fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted, marginTop: 1,
  },
  permRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10,
  },
  permDot: { width: 7, height: 7, borderRadius: 4 },
  permText: { fontSize: 12, fontFamily: "DM_Sans_500Medium" },

  // Unlock window
  windowChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1.5, borderColor: "transparent",
  },
  windowChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  windowChipText: { fontSize: 14, fontFamily: "DM_Sans_600SemiBold", color: Colors.textSecondary },
  windowChipTextOn: { color: Colors.white },

  // Screen Time card
  stCard: { paddingVertical: 16, gap: 14 },
  stHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  stIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  stTitle: { fontSize: 15, fontFamily: "DM_Sans_700Bold", color: Colors.text, marginBottom: 4 },
  stBody: {
    fontSize: 12, fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted, lineHeight: 17,
  },
  stSteps: { gap: 9 },
  stStep: { flexDirection: "row", alignItems: "center", gap: 10 },
  stStepNum: {
    width: 24, height: 24, borderRadius: 7,
    alignItems: "center", justifyContent: "center",
  },
  stStepNumText: { fontSize: 12, fontFamily: "DM_Sans_700Bold" },
  stStepText: { fontSize: 13, fontFamily: "DM_Sans_400Regular", color: Colors.textSecondary, flex: 1 },
  stStatus: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.bgSurface, borderRadius: 10, padding: 10,
  },
  stDot: { width: 8, height: 8, borderRadius: 4 },
  stStatusText: { fontSize: 12, fontFamily: "DM_Sans_500Medium", color: Colors.textSecondary },
  stBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#5856D6",
    borderRadius: 12, paddingVertical: 12,
  },
  stBtnText: { fontSize: 14, fontFamily: "DM_Sans_700Bold", color: Colors.white },
});
