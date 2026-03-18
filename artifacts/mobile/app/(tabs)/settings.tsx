import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
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

// Screen Time status row
function ScreenTimeStatusRow({ done }: { done: boolean }) {
  return (
    <View style={styles.stStatus}>
      <View style={[styles.stDot, { backgroundColor: done ? Colors.primary : Colors.accentLight }]} />
      <Text style={styles.stStatusText}>
        {done ? "Screen Time set up — you're covered" : "Not yet configured"}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings, clearAllData } = useApp();
  const [screenTimeDone, setScreenTimeDone] = useState(false);

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* ── Screen Time ────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(380)}>
          <Section title="SCREEN TIME">
            <View style={styles.stCard}>
              <View style={styles.stHeader}>
                <View style={[styles.stIconWrap, { backgroundColor: "rgba(88,86,214,0.12)" }]}>
                  <Ionicons name="time-outline" size={22} color="#5856D6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stTitle}>Set App Limits</Text>
                  <Text style={styles.stBody}>
                    Use iOS Screen Time to add hard limits on your gated apps. StretchGate uses the honor system — Screen Time adds the safety net.
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
              <ScreenTimeStatusRow done={screenTimeDone} />
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
        <Animated.View entering={FadeInDown.duration(380).delay(60)}>
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
        <Animated.View entering={FadeInDown.duration(380).delay(120)}>
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
        <Animated.View entering={FadeInDown.duration(380).delay(180)}>
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
        <Animated.View entering={FadeInDown.duration(380).delay(300)}>
          <Section title="ABOUT">
            <Row
              icon="leaf-outline"
              iconBg="rgba(58,122,92,0.12)"
              label="StretchGate"
              sub="Version 1.0 · Move before you scroll"
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
        <Animated.View entering={FadeInDown.duration(380).delay(360)}>
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
