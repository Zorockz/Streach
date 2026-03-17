import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
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

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingRow({
  icon, label, sub, right, onPress, danger,
}: {
  icon: string; label: string; sub?: string;
  right?: React.ReactNode; onPress?: () => void; danger?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon as any} size={18} color={danger ? Colors.error : Colors.primaryLight} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {right}
    </Pressable>
  );
}

function AppToggle({ app, selected, onPress }: {
  app: typeof DISTRACTING_APPS[0]; selected: boolean; onPress: () => void;
}) {
  return (
    <Pressable style={styles.appToggle} onPress={onPress}>
      <View style={[styles.appIcon, { backgroundColor: app.color + '20' }]}>
        <Ionicons name={app.icon as any} size={18} color={app.color === '#000000' ? Colors.text : app.color} />
      </View>
      <Text style={styles.appName}>{app.name}</Text>
      <View style={[styles.checkBox, selected && styles.checkBoxSelected]}>
        {selected && <Ionicons name="checkmark" size={12} color={Colors.primaryDeep} />}
      </View>
    </Pressable>
  );
}

function AreaToggle({ area, selected, onPress }: {
  area: typeof BODY_AREAS[0]; selected: boolean; onPress: () => void;
}) {
  return (
    <Pressable style={[styles.areaPill, selected && styles.areaPillActive]} onPress={onPress}>
      <Ionicons name={area.icon as any} size={13} color={selected ? Colors.primaryDeep : Colors.textSecondary} />
      <Text style={[styles.areaPillText, selected && styles.areaPillTextActive]}>{area.label}</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, clearAllData } = useApp();

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : 0;

  const toggleApp = async (appId: string) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    const current = settings.lockedApps;
    const updated = current.includes(appId)
      ? current.filter(a => a !== appId)
      : [...current, appId];
    await updateSettings({ lockedApps: updated });
  };

  const toggleArea = async (areaId: BodyArea) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    const current = settings.focusBodyAreas;
    const updated = current.includes(areaId)
      ? current.filter(a => a !== areaId)
      : [...current, areaId];
    await updateSettings({ focusBodyAreas: updated });
  };

  const setDailyGoal = async (goal: number) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    await updateSettings({ dailyGoal: goal });
  };

  const setDuration = async (dur: number) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    await updateSettings({ preferredDuration: dur });
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your sessions and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <SectionHeader title="LOCKED APPS" />
          <View style={styles.card}>
            <Text style={styles.cardSub}>Choose which apps require a stretch to unlock</Text>
            {DISTRACTING_APPS.map(app => (
              <AppToggle
                key={app.id}
                app={app}
                selected={settings.lockedApps.includes(app.id)}
                onPress={() => toggleApp(app.id)}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <SectionHeader title="BODY FOCUS AREAS" />
          <View style={styles.card}>
            <Text style={styles.cardSub}>Stretches will be selected from these areas. Leave empty for variety.</Text>
            <View style={styles.areasWrap}>
              {BODY_AREAS.map(area => (
                <AreaToggle
                  key={area.id}
                  area={area}
                  selected={settings.focusBodyAreas.includes(area.id)}
                  onPress={() => toggleArea(area.id)}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <SectionHeader title="STRETCH PREFERENCES" />
          <View style={styles.card}>
            <Text style={styles.rowLabel}>Daily Goal</Text>
            <Text style={[styles.cardSub, { marginBottom: 10 }]}>
              Target stretches per day
            </Text>
            <View style={styles.pillRow}>
              {[1, 2, 3, 5, 7].map(g => (
                <Pressable
                  key={g}
                  style={[styles.goalPill, settings.dailyGoal === g && styles.goalPillActive]}
                  onPress={() => setDailyGoal(g)}
                >
                  <Text style={[styles.goalPillText, settings.dailyGoal === g && styles.goalPillTextActive]}>
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.rowLabel}>Preferred Duration</Text>
            <Text style={[styles.cardSub, { marginBottom: 10 }]}>Minimum stretch time in seconds</Text>
            <View style={styles.pillRow}>
              {[20, 30, 45, 60].map(d => (
                <Pressable
                  key={d}
                  style={[styles.goalPill, settings.preferredDuration === d && styles.goalPillActive]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.goalPillText, settings.preferredDuration === d && styles.goalPillTextActive]}>
                    {d}s
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(250)}>
          <SectionHeader title="PREFERENCES" />
          <View style={styles.card}>
            <SettingRow
              icon="phone-portrait-outline"
              label="Haptic Feedback"
              sub="Vibration on key interactions"
              right={
                <Switch
                  value={settings.hapticEnabled}
                  onValueChange={v => updateSettings({ hapticEnabled: v })}
                  trackColor={{ false: Colors.surface, true: Colors.primaryLight }}
                  thumbColor={Colors.cream}
                />
              }
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <SectionHeader title="ABOUT" />
          <View style={styles.card}>
            <SettingRow icon="information-circle-outline" label="StretchGate" sub="Version 1.0.0" />
            <View style={styles.divider} />
            <SettingRow
              icon="refresh-outline"
              label="Restart Onboarding"
              sub="Go through setup again"
              onPress={() => router.replace('/onboarding')}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(350)}>
          <SectionHeader title="DANGER ZONE" />
          <View style={styles.card}>
            <SettingRow
              icon="trash-outline"
              label="Reset All Data"
              sub="Permanently delete sessions and settings"
              onPress={handleReset}
              danger
            />
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 8 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.text },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    marginBottom: 14,
    lineHeight: 17,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(122,184,147,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: 'rgba(229, 62, 62, 0.12)' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text },
  rowLabelDanger: { color: Colors.error },
  rowSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 1 },
  appToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  appIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  appName: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxSelected: { backgroundColor: Colors.softMint, borderColor: Colors.softMint },
  areasWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  areaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  areaPillActive: { backgroundColor: Colors.softMint, borderColor: Colors.primaryLight },
  areaPillText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  areaPillTextActive: { color: Colors.primaryDeep },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  goalPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  goalPillActive: { backgroundColor: Colors.softMint, borderColor: Colors.primaryLight },
  goalPillText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  goalPillTextActive: { color: Colors.primaryDeep },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 14 },
});
