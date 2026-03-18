import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { BODY_AREAS, DISTRACTING_APPS, BodyArea } from "@/constants/stretches";
import { useApp } from "@/context/AppContext";

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function Row({
  icon,
  label,
  sub,
  right,
  onPress,
  danger,
  iconBg,
}: {
  icon: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  iconBg?: string;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: iconBg ?? Colors.primaryMuted },
          danger && { backgroundColor: Colors.errorMuted },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={17}
          color={danger ? Colors.error : Colors.primary}
        />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, danger && { color: Colors.error }]}>
          {label}
        </Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, clearAllData } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const toggleApp = async (id: string) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    const updated = settings.lockedApps.includes(id)
      ? settings.lockedApps.filter((a) => a !== id)
      : [...settings.lockedApps, id];
    await updateSettings({ lockedApps: updated });
  };

  const toggleArea = async (id: BodyArea) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    const updated = settings.focusBodyAreas.includes(id)
      ? settings.focusBodyAreas.filter((a) => a !== id)
      : [...settings.focusBodyAreas, id];
    await updateSettings({ focusBodyAreas: updated });
  };

  const handleReset = () => {
    Alert.alert(
      "Reset All Data",
      "This permanently deletes all your sessions and settings. Cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
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
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Apps to lock */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <SectionLabel title="MINDFUL APPS" />
          <View style={styles.card}>
            <Text style={styles.cardSub}>
              Stretch before opening these apps — on your honor
            </Text>
            {DISTRACTING_APPS.map((app, i) => (
              <Pressable
                key={app.id}
                style={[
                  styles.appRow,
                  i < DISTRACTING_APPS.length - 1 && styles.rowDivider,
                ]}
                onPress={() => toggleApp(app.id)}
              >
                <View
                  style={[
                    styles.appIconBox,
                    { backgroundColor: app.color + "22" },
                  ]}
                >
                  <Ionicons
                    name={app.icon as any}
                    size={17}
                    color={
                      app.color === "#000000"
                        ? Colors.text
                        : app.color === "#FFFC00"
                          ? "#B8A800"
                          : app.color
                    }
                  />
                </View>
                <Text style={styles.appName}>{app.name}</Text>
                <View
                  style={[
                    styles.checkbox,
                    settings.lockedApps.includes(app.id) &&
                      styles.checkboxOn,
                  ]}
                >
                  {settings.lockedApps.includes(app.id) && (
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color={Colors.textInverted}
                    />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Body areas */}
        <Animated.View entering={FadeInDown.duration(400).delay(120)}>
          <SectionLabel title="FOCUS AREAS" />
          <View style={styles.card}>
            <Text style={styles.cardSub}>
              Personalize your stretches by body area. Leave empty for variety.
            </Text>
            <View style={styles.pillWrap}>
              {BODY_AREAS.map((area) => {
                const on = settings.focusBodyAreas.includes(area.id);
                return (
                  <Pressable
                    key={area.id}
                    style={[styles.pill, on && styles.pillOn]}
                    onPress={() => toggleArea(area.id)}
                  >
                    <Text style={[styles.pillText, on && styles.pillTextOn]}>
                      {area.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Daily goal */}
        <Animated.View entering={FadeInDown.duration(400).delay(180)}>
          <SectionLabel title="DAILY GOAL" />
          <View style={styles.card}>
            <Text style={styles.cardSub}>Target stretches per day</Text>
            <View style={styles.pillWrap}>
              {[1, 2, 3, 5, 7].map((g) => {
                const on = settings.dailyGoal === g;
                return (
                  <Pressable
                    key={g}
                    style={[styles.pill, on && styles.pillOn]}
                    onPress={() => updateSettings({ dailyGoal: g })}
                  >
                    <Text style={[styles.pillText, on && styles.pillTextOn]}>
                      {g}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Preferences */}
        <Animated.View entering={FadeInDown.duration(400).delay(240)}>
          <SectionLabel title="PREFERENCES" />
          <View style={styles.card}>
            <Row
              icon="phone-portrait-outline"
              label="Haptic Feedback"
              sub="Vibration on key actions"
              right={
                <Switch
                  value={settings.hapticEnabled}
                  onValueChange={(v) => updateSettings({ hapticEnabled: v })}
                  trackColor={{ false: Colors.bgCardAlt, true: Colors.primary }}
                  thumbColor={Colors.text}
                  ios_backgroundColor={Colors.bgCardAlt}
                />
              }
            />
          </View>
        </Animated.View>

        {/* Account */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <SectionLabel title="ABOUT" />
          <View style={styles.card}>
            <Row
              icon="information-circle-outline"
              label="StretchGate"
              sub="Version 1.0  ·  The honor-system wellness app"
            />
            <View style={styles.rowDivider} />
            <Row
              icon="refresh-outline"
              label="Restart Onboarding"
              onPress={() => router.replace("/onboarding")}
            />
          </View>
        </Animated.View>

        {/* Danger */}
        <Animated.View entering={FadeInDown.duration(400).delay(360)}>
          <SectionLabel title="DANGER ZONE" />
          <View style={styles.card}>
            <Row
              icon="trash-outline"
              label="Reset All Data"
              sub="Delete all sessions and preferences"
              onPress={handleReset}
              danger
            />
          </View>
        </Animated.View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, marginBottom: 6 },
  title: {
    fontSize: 26,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
    lineHeight: 17,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginVertical: 10,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1 },
  rowLabel: {
    fontSize: 14,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.text,
  },
  rowSub: {
    fontSize: 11,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
    marginTop: 1,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 9,
  },
  appIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.text,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderColor: "transparent",
  },
  pillOn: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  pillText: {
    fontSize: 13,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textSecondary,
  },
  pillTextOn: { color: Colors.primaryLight },
});
