import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { STRETCH_CATEGORIES, DISTRACTING_APPS, BodyArea } from "@/constants/stretches";
import { useApp } from "@/context/AppContext";
import {
  requestReminderPermissions,
  syncStretchReminderNotifications,
  DEFAULT_REMINDER_HOURS,
} from "@/services/notifications";
import type { ReminderTime, ReminderHourConfig } from "@/services/notifications";
import {
  requestFamilyControlsAuth,
  getFamilyControlsStatus,
  isNativeAvailable,
} from "@/services/familyControls";
import type { FamilyControlsStatus } from "@/services/familyControls";

// ── Helpers ───────────────────────────────────────────────────────────

interface TimeOption { hour: number; minute: number; label: string; }

function buildTimeOptions(): TimeOption[] {
  const opts: TimeOption[] = [];
  for (let h = 5; h <= 23; h++) {
    for (const m of [0, 30]) {
      const ampm = h < 12 ? "AM" : "PM";
      const hD = h % 12 || 12;
      const mD = m === 0 ? "00" : "30";
      opts.push({ hour: h, minute: m, label: `${hD}:${mD} ${ampm}` });
    }
  }
  return opts;
}
const TIME_OPTIONS = buildTimeOptions();

function formatHourConfig(cfg: ReminderHourConfig): string {
  const ampm = cfg.hour < 12 ? "AM" : "PM";
  const h = cfg.hour % 12 || 12;
  const m = cfg.minute === 0 ? "00" : "30";
  return `${h}:${m} ${ampm}`;
}

const REMINDER_OPTS: { id: ReminderTime; label: string; icon: string }[] = [
  { id: "morning", label: "Morning", icon: "cafe-outline" },
  { id: "midday",  label: "Midday",  icon: "partly-sunny-outline" },
  { id: "evening", label: "Evening", icon: "moon-outline" },
];

// ── Row building blocks ───────────────────────────────────────────────

function NavRow({
  icon, iconBg, iconColor = Colors.primary,
  label, labelColor, value, right,
  onPress, divider = true,
}: {
  icon: string; iconBg?: string; iconColor?: string;
  label: string; labelColor?: string;
  value?: string; right?: React.ReactNode;
  onPress?: () => void; divider?: boolean;
}) {
  return (
    <Pressable
      style={[s.row, !divider && { borderBottomWidth: 0 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[s.rowIcon, { backgroundColor: iconBg ?? Colors.primaryMuted }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={[s.rowLabel, labelColor ? { color: labelColor } : undefined]}>{label}</Text>
      {value && <Text style={s.rowValue}>{value}</Text>}
      {right}
      {onPress && !right && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
    </Pressable>
  );
}

function ToggleRow({
  icon, iconBg, iconColor = Colors.primary, label, sub, value, onChange, divider = true,
}: {
  icon: string; iconBg?: string; iconColor?: string;
  label: string; sub?: string;
  value: boolean; onChange: (v: boolean) => void; divider?: boolean;
}) {
  return (
    <View style={[s.row, !divider && { borderBottomWidth: 0 }]}>
      <View style={[s.rowIcon, { backgroundColor: iconBg ?? Colors.primaryMuted }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.bgSurface, true: Colors.primary }}
        thumbColor={Colors.white}
        ios_backgroundColor={Colors.bgSurface}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      {title ? <Text style={s.sectionTitle}>{title}</Text> : null}
      <View style={s.card}>{children}</View>
    </View>
  );
}

// ── Time picker modal ─────────────────────────────────────────────────

function TimePickerModal({
  visible, reminderTime, current, onSelect, onClose,
}: {
  visible: boolean; reminderTime: ReminderTime;
  current: ReminderHourConfig; onSelect: (cfg: ReminderHourConfig) => void; onClose: () => void;
}) {
  const LABEL: Record<ReminderTime, string> = { morning: "Morning", midday: "Midday", evening: "Evening" };
  const flatRef = useRef<FlatList>(null);
  useEffect(() => {
    if (!visible) return;
    const idx = TIME_OPTIONS.findIndex(t => t.hour === current.hour && t.minute === current.minute);
    if (idx >= 0 && flatRef.current) {
      setTimeout(() => flatRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0.4 }), 100);
    }
  }, [visible, current]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose} />
      <View style={m.sheet}>
        <View style={m.handle} />
        <Text style={m.title}>{LABEL[reminderTime]} reminder</Text>
        <FlatList
          ref={flatRef}
          data={TIME_OPTIONS}
          keyExtractor={item => `${item.hour}:${item.minute}`}
          style={{ maxHeight: 300 }}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={() => {}}
          renderItem={({ item }) => {
            const selected = item.hour === current.hour && item.minute === current.minute;
            return (
              <Pressable
                style={[m.option, selected && m.optSel]}
                onPress={() => { onSelect({ hour: item.hour, minute: item.minute }); onClose(); }}
              >
                <Text style={[m.optText, selected && m.optTextSel]}>{item.label}</Text>
                {selected && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
              </Pressable>
            );
          }}
        />
        <Pressable style={m.cancel} onPress={onClose}>
          <Text style={m.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(26,46,34,0.45)" },
  sheet: {
    backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20, paddingBottom: 32, maxHeight: "65%",
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.divider, alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 17, fontFamily: "DM_Sans_700Bold", color: Colors.text, marginBottom: 12 },
  option: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 13, paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider,
  },
  optSel: { backgroundColor: Colors.primaryMuted, borderRadius: 10, paddingHorizontal: 10, marginHorizontal: -6 },
  optText: { fontSize: 15, fontFamily: "DM_Sans_500Medium", color: Colors.textSecondary },
  optTextSel: { color: Colors.primary, fontFamily: "DM_Sans_700Bold" },
  cancel: { marginTop: 14, alignItems: "center", paddingVertical: 10 },
  cancelText: { fontSize: 14, fontFamily: "DM_Sans_500Medium", color: Colors.textMuted },
});

// ── Generic list-picker modal ─────────────────────────────────────────

function ListPickerModal<T extends { value: any; label: string }>({
  visible, title, options, selected, onSelect, onClose,
}: {
  visible: boolean; title: string;
  options: T[]; selected: any;
  onSelect: (v: any) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose} />
      <View style={m.sheet}>
        <View style={m.handle} />
        <Text style={m.title}>{title}</Text>
        {options.map((opt, i) => {
          const on = opt.value === selected;
          return (
            <Pressable
              key={String(opt.value)}
              style={[m.option, i === options.length - 1 && { borderBottomWidth: 0 }, on && m.optSel]}
              onPress={() => { onSelect(opt.value); onClose(); }}
            >
              <Text style={[m.optText, on && m.optTextSel]}>{opt.label}</Text>
              {on && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
            </Pressable>
          );
        })}
        <Pressable style={m.cancel} onPress={onClose}>
          <Text style={m.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

// ── App selection modal ───────────────────────────────────────────────

function AppSelectionModal({
  visible, selected, onToggle, onClose,
}: {
  visible: boolean; selected: string[]; onToggle: (id: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose} />
      <View style={[m.sheet, { maxHeight: "75%" }]}>
        <View style={m.handle} />
        <Text style={m.title}>Apps to Lock</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {DISTRACTING_APPS.map((app, i) => {
            const on = selected.includes(app.id);
            return (
              <Pressable
                key={app.id}
                style={[m.option, i === DISTRACTING_APPS.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => onToggle(app.id)}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                  <View style={[{ width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: app.color + "20" }]}>
                    <Ionicons
                      name={app.icon as any} size={18}
                      color={app.color === "#010101" || app.color === "#FFCA00" ? Colors.text : app.color}
                    />
                  </View>
                  <Text style={m.optText}>{app.name}</Text>
                </View>
                <View style={[{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: Colors.divider, alignItems: "center", justifyContent: "center" }, on && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
                  {on && <Ionicons name="checkmark" size={13} color={Colors.white} />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable style={[m.cancel, { backgroundColor: Colors.primary, borderRadius: 14, marginTop: 8 }]} onPress={onClose}>
          <Text style={[m.cancelText, { color: Colors.white, fontFamily: "DM_Sans_600SemiBold" }]}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

// ── Focus area modal ──────────────────────────────────────────────────

function FocusAreaModal({
  visible, selected, onToggle, onClose,
}: {
  visible: boolean; selected: BodyArea[]; onToggle: (id: BodyArea) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose} />
      <View style={[m.sheet, { maxHeight: "70%" }]}>
        <View style={m.handle} />
        <Text style={m.title}>Focus Areas</Text>
        <Text style={{ fontSize: 12, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted, marginBottom: 14 }}>
          Stretches will be tailored to these areas. Leave empty for variety.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 8 }}>
          {STRETCH_CATEGORIES.map(cat => {
            const on = selected.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                style={[fa.chip, on && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                onPress={() => onToggle(cat.id)}
              >
                <Ionicons name={cat.icon as any} size={13} color={on ? Colors.white : Colors.textSecondary} />
                <Text style={[fa.chipText, on && { color: Colors.white }]}>{cat.label.split(" ")[0]}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={[m.cancel, { backgroundColor: Colors.primary, borderRadius: 14, marginTop: 12 }]} onPress={onClose}>
          <Text style={[m.cancelText, { color: Colors.white, fontFamily: "DM_Sans_600SemiBold" }]}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const fa = StyleSheet.create({
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: Colors.bgSurface, borderWidth: 1.5, borderColor: "transparent",
  },
  chipText: { fontSize: 13, fontFamily: "DM_Sans_500Medium", color: Colors.textSecondary },
});

// ── Main settings screen ──────────────────────────────────────────────

export default function SettingsScreen() {
  const { settings, updateSettings, clearAllData, currentStreak } = useApp();

  // Notification permission
  const [permStatus, setPermStatus] = useState<"undetermined" | "granted" | "denied">(
    settings.notificationPermissionStatus
  );
  useEffect(() => { setPermStatus(settings.notificationPermissionStatus); }, [settings.notificationPermissionStatus]);

  // Family Controls
  const [fcStatus, setFcStatus] = useState<FamilyControlsStatus>(
    settings.familyControlsAuthorized ? "authorized" : "undetermined"
  );
  const [fcLoading, setFcLoading] = useState(false);
  useEffect(() => {
    getFamilyControlsStatus().then(s => {
      setFcStatus(s);
      if (s === "authorized" && !settings.familyControlsAuthorized)
        updateSettings({ familyControlsAuthorized: true });
    });
  }, []);

  const handleRequestFC = async () => {
    if (Platform.OS !== "ios") return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFcLoading(true);
    try {
      const status = await requestFamilyControlsAuth();
      setFcStatus(status);
      await updateSettings({ familyControlsAuthorized: status === "authorized" });
    } finally { setFcLoading(false); }
  };

  // Time picker
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<ReminderTime>("morning");
  const openTimePicker = (rt: ReminderTime) => { setPickerTarget(rt); setPickerVisible(true); };
  const currentHoursFor = (rt: ReminderTime): ReminderHourConfig =>
    settings.reminderHours?.[rt] ?? DEFAULT_REMINDER_HOURS[rt];
  const handleTimeSelect = async (cfg: ReminderHourConfig) => {
    const newHours = { ...settings.reminderHours, [pickerTarget]: cfg };
    await updateSettings({ reminderHours: newHours });
    await syncNotifs({ reminderHours: newHours });
  };

  // Modal visibility
  const [showApps, setShowApps] = useState(false);
  const [showFocus, setShowFocus] = useState(false);
  const [showDuration, setShowDuration] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  // Notification sync
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

  // Handlers
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
    if (enabled && permStatus !== "granted") {
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
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    const current = settings.selectedReminderTimes;
    const updated = current.includes(id) ? current.filter(t => t !== id) : [...current, id];
    await updateSettings({ selectedReminderTimes: updated });
    await syncNotifs({ selectedReminderTimes: updated });
  };

  const handleReset = () => {
    Alert.alert(
      "Reset All Data",
      "This permanently deletes all sessions and preferences. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything", style: "destructive",
          onPress: async () => { await clearAllData(); router.replace("/onboarding"); },
        },
      ]
    );
  };

  // Derived values for display
  const appsLabel = settings.lockedApps.length === 0
    ? "None selected" : `${settings.lockedApps.length} app${settings.lockedApps.length > 1 ? "s" : ""}`;
  const focusLabel = settings.focusBodyAreas.length === 0
    ? "All areas" : settings.focusBodyAreas.length === 1
    ? settings.focusBodyAreas[0] : `${settings.focusBodyAreas.length} areas`;
  const durationLabel = `${settings.preferredDuration}s`;

  const fcLabel = fcStatus === "authorized"
    ? "Active"
    : fcStatus === "denied"
    ? "Denied"
    : !isNativeAvailable()
    ? "Dev build required"
    : "Not authorized";

  const canRequestFC = fcStatus !== "authorized" && !fcLoading && isNativeAvailable();

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Header */}
        <View style={s.header}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={s.title}>Settings</Text>
        </View>

        {/* ── Screen Time Access ────────────────────────────────── */}
        <Section title="SCREEN TIME">
          <NavRow
            icon="shield-checkmark-outline"
            iconBg={fcStatus === "authorized" ? Colors.primaryMuted : "rgba(201,106,50,0.1)"}
            iconColor={fcStatus === "authorized" ? Colors.primary : Colors.accent}
            label="Apple Screen Time"
            value={fcLabel}
            onPress={canRequestFC ? handleRequestFC : undefined}
            divider={false}
          />
        </Section>

        {/* ── Apps to Lock ──────────────────────────────────────── */}
        <Section title="APPS TO LOCK">
          <NavRow
            icon="lock-closed-outline"
            iconBg="rgba(58,122,92,0.1)"
            label="Apps"
            value={appsLabel}
            onPress={() => setShowApps(true)}
            divider={false}
          />
        </Section>

        {/* ── Lock Schedule (reminders) ─────────────────────────── */}
        <Section title="LOCK SCHEDULE">
          <ToggleRow
            icon="notifications-outline"
            iconBg="rgba(58,122,92,0.1)"
            label="Stretch reminders"
            sub={settings.reminderEnabled && permStatus === "denied" ? "Permission denied — tap to open Settings" : undefined}
            value={settings.reminderEnabled}
            onChange={toggleReminderMaster}
            divider={settings.reminderEnabled}
          />
          {settings.reminderEnabled && REMINDER_OPTS.map((opt, i) => {
            const on = settings.selectedReminderTimes.includes(opt.id);
            const cfg = currentHoursFor(opt.id);
            return (
              <View
                key={opt.id}
                style={[s.row, i === REMINDER_OPTS.length - 1 && { borderBottomWidth: 0 }]}
              >
                <Pressable style={s.reminderLeft} onPress={() => toggleReminderTime(opt.id)}>
                  <View style={[s.rowIcon, { backgroundColor: on ? Colors.primaryMuted : Colors.bgSurface }]}>
                    <Ionicons name={opt.icon as any} size={20} color={on ? Colors.primary : Colors.textMuted} />
                  </View>
                  <Text style={[s.rowLabel, !on && { color: Colors.textSecondary }]}>{opt.label}</Text>
                </Pressable>
                {on ? (
                  <Pressable style={s.timeChip} onPress={() => openTimePicker(opt.id)}>
                    <Text style={s.timeChipText}>{formatHourConfig(cfg)}</Text>
                    <Ionicons name="chevron-down" size={11} color={Colors.primary} />
                  </Pressable>
                ) : (
                  <View style={[s.remCheck]}>
                    <View style={s.remDot} />
                  </View>
                )}
              </View>
            );
          })}
        </Section>

        {/* ── Stretch Settings ──────────────────────────────────── */}
        <Section title="STRETCH SETTINGS">
          <NavRow
            icon="body-outline"
            iconBg="rgba(58,122,92,0.1)"
            label="Focus areas"
            value={focusLabel}
            onPress={() => setShowFocus(true)}
            divider
          />
          <NavRow
            icon="timer-outline"
            iconBg="rgba(58,122,92,0.1)"
            label="Duration"
            value={durationLabel}
            onPress={() => setShowDuration(true)}
            divider
          />
          <NavRow
            icon="flag-outline"
            iconBg="rgba(58,122,92,0.1)"
            label="Daily goal"
            value={`${settings.dailyGoal} stretch${settings.dailyGoal > 1 ? "es" : ""}`}
            onPress={() => setShowGoal(true)}
            divider={false}
          />
        </Section>

        {/* ── Notifications ─────────────────────────────────────── */}
        <Section title="NOTIFICATIONS">
          <ToggleRow
            icon="flame-outline"
            iconBg="rgba(201,106,50,0.1)"
            iconColor={Colors.accent}
            label="Streak reminder"
            sub="Alert if you haven't stretched by evening"
            value={settings.streakNotifEnabled}
            onChange={async v => { await updateSettings({ streakNotifEnabled: v }); await syncNotifs({ streakNotifEnabled: v }); }}
            divider
          />
          <ToggleRow
            icon="phone-portrait-outline"
            iconBg="rgba(88,86,214,0.12)"
            iconColor="#5856D6"
            label="Haptic feedback"
            value={settings.hapticEnabled}
            onChange={v => updateSettings({ hapticEnabled: v })}
            divider={false}
          />
        </Section>

        {/* ── Support ───────────────────────────────────────────── */}
        <Section title="SUPPORT">
          <NavRow
            icon="document-text-outline"
            iconBg={Colors.primaryMuted}
            label="Privacy Policy"
            onPress={() => Linking.openURL("https://www.termsfeed.com/live/ee6484bf-6c19-4aca-baed-79f084570331")}
            divider
          />
          <NavRow
            icon="mail-outline"
            iconBg={Colors.primaryMuted}
            label="Contact Support"
            onPress={() => Linking.openURL("mailto:simodigitalagency@gmail.com")}
            divider={false}
          />
        </Section>

        {/* Version info */}
        <View style={s.infoCard}>
          <Text style={s.infoLabel}>Version</Text>
          <Text style={s.infoValue}>1.0.0</Text>
        </View>

        {/* ── Danger Zone ───────────────────────────────────────── */}
        <Section title="">
          <NavRow
            icon="trash-outline"
            iconBg="rgba(220,53,69,0.1)"
            iconColor={Colors.error}
            label="Reset All Data"
            labelColor={Colors.error}
            onPress={handleReset}
            divider={false}
          />
        </Section>

      </ScrollView>

      {/* Modals */}
      <TimePickerModal
        visible={pickerVisible}
        reminderTime={pickerTarget}
        current={currentHoursFor(pickerTarget)}
        onSelect={handleTimeSelect}
        onClose={() => setPickerVisible(false)}
      />
      <AppSelectionModal
        visible={showApps}
        selected={settings.lockedApps}
        onToggle={toggleApp}
        onClose={() => setShowApps(false)}
      />
      <FocusAreaModal
        visible={showFocus}
        selected={settings.focusBodyAreas}
        onToggle={toggleArea}
        onClose={() => setShowFocus(false)}
      />
      <ListPickerModal
        visible={showDuration}
        title="Stretch Duration"
        options={[
          { value: 20, label: "20 seconds — Quick reset" },
          { value: 45, label: "45 seconds — Sweet spot" },
          { value: 60, label: "60 seconds — Deep stretch" },
        ]}
        selected={settings.preferredDuration}
        onSelect={v => updateSettings({ preferredDuration: v })}
        onClose={() => setShowDuration(false)}
      />
      <ListPickerModal
        visible={showGoal}
        title="Daily Goal"
        options={[1, 2, 3, 5, 7, 10].map(v => ({ value: v, label: `${v} stretch${v > 1 ? "es" : ""} per day` }))}
        selected={settings.dailyGoal}
        onSelect={v => updateSettings({ dailyGoal: v })}
        onClose={() => setShowGoal(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.divider,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 32, fontFamily: "DM_Sans_700Bold", color: Colors.text, letterSpacing: -0.8 },

  section: { marginBottom: 4 },
  sectionTitle: {
    fontSize: 11, fontFamily: "DM_Sans_600SemiBold",
    color: Colors.textMuted, letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: 20, marginTop: 20, marginBottom: 6,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 16,
  },

  row: {
    flexDirection: "row", alignItems: "center",
    gap: 13, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
    minHeight: 52,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "DM_Sans_500Medium", color: Colors.text },
  rowSub: { fontSize: 11.5, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted, marginTop: 1 },
  rowValue: { fontSize: 14, fontFamily: "DM_Sans_400Regular", color: Colors.textSecondary, marginRight: 2 },

  reminderLeft: { flexDirection: "row", alignItems: "center", gap: 13, flex: 1 },
  remCheck: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  remDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.divider },
  timeChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  timeChipText: { fontSize: 12, fontFamily: "DM_Sans_700Bold", color: Colors.primary },

  infoCard: {
    marginHorizontal: 16, marginTop: 4,
    backgroundColor: Colors.bgCard,
    borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: Colors.divider,
    paddingHorizontal: 20, paddingVertical: 15,
    flexDirection: "row", alignItems: "center",
  },
  infoLabel: { flex: 1, fontSize: 15, fontFamily: "DM_Sans_500Medium", color: Colors.text },
  infoValue: { fontSize: 14, fontFamily: "DM_Sans_400Regular", color: Colors.textSecondary },
});
