import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { DISTRACTING_APPS, getRandomStretch } from "@/constants/stretches";

function StartButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handle = async () => {
    if (Platform.OS !== "web")
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withTiming(0.97, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    onPress();
  };

  return (
    <Animated.View style={animStyle}>
      <Pressable style={styles.startCard} onPress={handle}>
        <View style={styles.startLeft}>
          <View style={styles.startIconBox}>
            <Ionicons name="body-outline" size={24} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.startTitle}>Start a Stretch</Text>
            <Text style={styles.startSub}>Move before you scroll</Text>
          </View>
        </View>
        <View style={styles.startArrow}>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function formatRemainingTime(ms: number): string {
  const totalSecs = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins > 0) return `${mins}m left`;
  return `${secs}s left`;
}

export default function HomeScreen() {
  const {
    settings,
    sessions,
    todayCount,
    currentStreak,
    totalSessions,
    isAppUnlocked,
    getUnlockRemainingMs,
    cleanupExpiredUnlocks,
  } = useApp();

  const lockedApps = DISTRACTING_APPS.filter(a => settings.lockedApps.includes(a.id));
  const progress = Math.min(todayCount / (settings.dailyGoal || 3), 1);
  const goalMet = todayCount >= (settings.dailyGoal || 3);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const recentIds = sessions.slice(0, 3).map(s => s.stretchId);

  // Countdown ticker — re-renders every 10s so unlock timers update
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(id);
  }, []);

  // Clean up expired unlocks every time this tab gains focus
  useFocusEffect(
    useCallback(() => {
      cleanupExpiredUnlocks();
    }, [cleanupExpiredUnlocks])
  );

  const handleStart = () => {
    const s = getRandomStretch(settings.focusBodyAreas, recentIds, settings.preferredDuration);
    router.push({ pathname: "/stretch/session", params: { stretchId: s.id } });
  };

  const handleAppPress = (app: typeof DISTRACTING_APPS[0]) => {
    if (isAppUnlocked(app.id)) {
      // Already unlocked — tapping it does nothing extra; badge shows remaining time
      return;
    }
    const s = getRandomStretch(settings.focusBodyAreas, recentIds, settings.preferredDuration);
    router.push({
      pathname: "/stretch/session",
      params: { stretchId: s.id, targetApp: app.name, targetAppId: app.id },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.headline}>{goalMet ? "Goal complete" : "Move & breathe"}</Text>
          </View>
          {currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color={Colors.accent} />
              <Text style={styles.streakNum}>{currentStreak}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
          )}
        </Animated.View>

        {/* Start CTA */}
        <Animated.View entering={FadeInDown.duration(450).delay(60)}>
          <StartButton onPress={handleStart} />
        </Animated.View>

        {/* Daily goal card */}
        <Animated.View entering={FadeInDown.duration(450).delay(120)} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardLabelRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary} />
              <Text style={styles.cardLabel}>Daily goal</Text>
            </View>
            {goalMet ? (
              <View style={styles.donePill}>
                <Ionicons name="checkmark" size={10} color={Colors.white} />
                <Text style={styles.donePillText}>Done</Text>
              </View>
            ) : (
              <Text style={styles.cardMeta}>{todayCount} / {settings.dailyGoal}</Text>
            )}
          </View>
          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: goalMet ? Colors.accent : Colors.primary }
            ]} />
          </View>
          <Text style={styles.progressHint}>
            {goalMet
              ? "You've hit your target for today"
              : `${settings.dailyGoal - todayCount} more stretch${settings.dailyGoal - todayCount !== 1 ? 'es' : ''} to go`}
          </Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.duration(450).delay(180)} style={styles.statsRow}>
          {[
            { label: "Today", value: todayCount, icon: "flash-outline" },
            { label: "Streak", value: `${currentStreak}d`, icon: "flame-outline", accent: true },
            { label: "Total", value: totalSessions, icon: "trophy-outline" },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statBox, stat.accent && styles.statBoxAccent]}>
              <Ionicons name={stat.icon as any} size={15} color={stat.accent ? Colors.accent : Colors.primary} />
              <Text style={[styles.statVal, stat.accent && { color: Colors.accent }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Mindful gates */}
        {lockedApps.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(450).delay(240)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLabelRow}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.primary} />
                <Text style={styles.cardLabel}>Mindful gates</Text>
              </View>
              <Pressable onPress={() => router.navigate("/settings")}>
                <Text style={styles.editLink}>Edit</Text>
              </Pressable>
            </View>
            <Text style={styles.cardSub}>
              Honor system \u00b7 stretch before you scroll
            </Text>
            <View style={styles.appsWrap}>
              {lockedApps.map(app => {
                const unlocked = isAppUnlocked(app.id);
                const remainingMs = unlocked ? getUnlockRemainingMs(app.id) : 0;
                return (
                  <Pressable
                    key={app.id}
                    style={[styles.appChip, unlocked && styles.appChipUnlocked]}
                    onPress={() => handleAppPress(app)}
                    accessibilityLabel={
                      unlocked
                        ? `${app.name} unlocked, ${formatRemainingTime(remainingMs)}`
                        : `Tap to stretch before opening ${app.name}`
                    }
                  >
                    {unlocked ? (
                      <Ionicons name="lock-open-outline" size={13} color={Colors.accent} />
                    ) : (
                      <Ionicons name={app.icon as any} size={13} color={Colors.textSecondary} />
                    )}
                    <Text style={[styles.appChipText, unlocked && styles.appChipTextUnlocked]}>
                      {app.name}
                    </Text>
                    {unlocked && (
                      <Text style={styles.unlockBadge}>
                        {formatRemainingTime(remainingMs)}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(450).delay(240)}>
            <Pressable style={styles.setupRow} onPress={() => router.navigate("/settings")}>
              <View style={[styles.setupIcon, { backgroundColor: Colors.accentMuted }]}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.accent} />
              </View>
              <View style={styles.setupText}>
                <Text style={styles.setupTitle}>Set up your gates</Text>
                <Text style={styles.setupSub}>Choose apps that trigger a stretch</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          </Animated.View>
        )}

        {/* Browse library */}
        <Animated.View entering={FadeInDown.duration(450).delay(300)}>
          <Pressable style={styles.setupRow} onPress={() => router.navigate("/stretches")}>
            <View style={[styles.setupIcon, { backgroundColor: Colors.primaryMuted }]}>
              <Ionicons name="body-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.setupText}>
              <Text style={styles.setupTitle}>Explore the stretch library</Text>
              <Text style={styles.setupSub}>17 stretches across 6 categories</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        </Animated.View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 20,
  },
  greeting: { fontSize: 12, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted, marginBottom: 2 },
  headline: { fontSize: 27, fontFamily: "DM_Sans_700Bold", color: Colors.text, letterSpacing: -0.4 },
  streakBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.accentMuted, paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 20,
  },
  streakNum: { fontSize: 15, fontFamily: "DM_Sans_700Bold", color: Colors.accent },
  streakLabel: { fontSize: 11, fontFamily: "DM_Sans_400Regular", color: Colors.accent },
  startCard: {
    backgroundColor: Colors.primary, borderRadius: 18, padding: 18,
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 14,
  },
  startLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  startIconBox: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  startTitle: { fontSize: 17, fontFamily: "DM_Sans_700Bold", color: Colors.white, marginBottom: 2 },
  startSub: { fontSize: 12, fontFamily: "DM_Sans_400Regular", color: "rgba(255,255,255,0.65)" },
  startArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: 18,
    padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.divider,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardLabel: { fontSize: 14, fontFamily: "DM_Sans_600SemiBold", color: Colors.text },
  cardMeta: { fontSize: 13, fontFamily: "DM_Sans_500Medium", color: Colors.textSecondary },
  cardSub: { fontSize: 12, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted, lineHeight: 17, marginBottom: 12 },
  editLink: { fontSize: 13, fontFamily: "DM_Sans_500Medium", color: Colors.primary },
  donePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.primary, paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 10,
  },
  donePillText: { fontSize: 11, fontFamily: "DM_Sans_600SemiBold", color: Colors.white },
  progressTrack: {
    height: 5, backgroundColor: Colors.bgSurface,
    borderRadius: 3, overflow: "hidden", marginBottom: 8,
  },
  progressFill: { height: "100%", borderRadius: 3 },
  progressHint: { fontSize: 12, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },
  statsRow: { flexDirection: "row", gap: 9, marginBottom: 12 },
  statBox: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14,
    padding: 14, alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: Colors.divider,
  },
  statBoxAccent: { backgroundColor: Colors.accentMuted, borderColor: "transparent" },
  statVal: { fontSize: 22, fontFamily: "DM_Sans_700Bold", color: Colors.text },
  statLabel: { fontSize: 10, fontFamily: "DM_Sans_500Medium", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
  appsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  appChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.bgSurface, paddingHorizontal: 12,
    paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: "transparent",
  },
  appChipUnlocked: {
    backgroundColor: Colors.accentMuted,
    borderColor: Colors.accent + "40",
  },
  appChipText: { fontSize: 12, fontFamily: "DM_Sans_500Medium", color: Colors.textSecondary },
  appChipTextUnlocked: { color: Colors.accent },
  unlockBadge: {
    fontSize: 11, fontFamily: "DM_Sans_600SemiBold",
    color: Colors.accent, marginLeft: 2,
  },
  setupRow: {
    backgroundColor: Colors.bgCard, borderRadius: 18, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.divider,
  },
  setupIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  setupText: { flex: 1 },
  setupTitle: { fontSize: 14, fontFamily: "DM_Sans_600SemiBold", color: Colors.text, marginBottom: 2 },
  setupSub: { fontSize: 12, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },
});
