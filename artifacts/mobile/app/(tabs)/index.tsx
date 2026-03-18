import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { getRandomStretch } from "@/constants/stretches";
import { DISTRACTING_APPS } from "@/constants/stretches";

function PulseButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    scale.value = withSequence(
      withTiming(0.96, { duration: 90 }),
      withSpring(1, { damping: 10, stiffness: 180 })
    );
    onPress();
  };

  return (
    <Animated.View style={animStyle}>
      <Pressable style={styles.quickBtn} onPress={handlePress}>
        <View style={styles.quickBtnLeft}>
          <View style={styles.quickBtnIcon}>
            <Ionicons name="body-outline" size={22} color={Colors.textInverted} />
          </View>
          <View>
            <Text style={styles.quickBtnTitle}>Start a Stretch</Text>
            <Text style={styles.quickBtnSub}>Feel better in 30 seconds</Text>
          </View>
        </View>
        <View style={styles.quickBtnArrow}>
          <Ionicons name="arrow-forward" size={18} color={Colors.textInverted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function StatPill({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.statPill, accent && styles.statPillAccent]}>
      <Ionicons
        name={icon as any}
        size={16}
        color={accent ? Colors.accent : Colors.primary}
      />
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { settings, todayCount, currentStreak, totalSessions } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const lockedApps = DISTRACTING_APPS.filter((a) =>
    settings.lockedApps.includes(a.id)
  );
  const progress = Math.min(todayCount / (settings.dailyGoal || 3), 1);
  const goalMet = todayCount >= (settings.dailyGoal || 3);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const handleStartStretch = () => {
    const stretch = getRandomStretch(settings.focusBodyAreas);
    router.push({
      pathname: "/stretch/session",
      params: { stretchId: stretch.id },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.headline}>
              {goalMet ? "Goal crushed!" : "Ready to move?"}
            </Text>
          </View>
          {currentStreak > 0 && (
            <View style={styles.streakChip}>
              <Ionicons name="flame" size={16} color={Colors.accent} />
              <Text style={styles.streakNum}>{currentStreak}</Text>
            </View>
          )}
        </Animated.View>

        {/* Quick start */}
        <Animated.View entering={FadeInDown.duration(500).delay(80)}>
          <PulseButton onPress={handleStartStretch} />
        </Animated.View>

        {/* Stats row */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(160)}
          style={styles.statsRow}
        >
          <StatPill
            label="Today"
            value={todayCount}
            icon="checkmark-circle-outline"
          />
          <StatPill
            label="Streak"
            value={`${currentStreak}d`}
            icon="flame-outline"
            accent
          />
          <StatPill
            label="Total"
            value={totalSessions}
            icon="trophy-outline"
          />
        </Animated.View>

        {/* Daily goal */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(240)}
          style={styles.card}
        >
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>Daily Goal</Text>
            {goalMet ? (
              <View style={styles.goalDoneBadge}>
                <Ionicons name="checkmark" size={11} color={Colors.textInverted} />
                <Text style={styles.goalDoneText}>Complete</Text>
              </View>
            ) : (
              <Text style={styles.cardMeta}>
                {todayCount}/{settings.dailyGoal}
              </Text>
            )}
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: goalMet ? Colors.accent : Colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressHint}>
            {goalMet
              ? "You've hit your daily target"
              : `${settings.dailyGoal - todayCount} stretch${settings.dailyGoal - todayCount !== 1 ? "es" : ""} to go`}
          </Text>
        </Animated.View>

        {/* Locked apps */}
        {lockedApps.length > 0 ? (
          <Animated.View
            entering={FadeInDown.duration(500).delay(320)}
            style={styles.card}
          >
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>Mindful Apps</Text>
              <Pressable onPress={() => router.navigate("/settings")}>
                <Text style={styles.cardLink}>Edit</Text>
              </Pressable>
            </View>
            <Text style={styles.cardSub}>
              Stretch first, then scroll — honor system
            </Text>
            <View style={styles.appsWrap}>
              {lockedApps.map((app) => (
                <Pressable
                  key={app.id}
                  style={styles.appChip}
                  onPress={handleStartStretch}
                >
                  <Ionicons
                    name={app.icon as any}
                    size={14}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.appChipText}>{app.name}</Text>
                  <Ionicons name="lock-closed" size={10} color={Colors.accent} />
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(500).delay(320)}>
            <Pressable
              style={styles.setupCard}
              onPress={() => router.navigate("/settings")}
            >
              <View style={[styles.setupIcon, { backgroundColor: Colors.accentMuted }]}>
                <Ionicons name="lock-closed-outline" size={22} color={Colors.accent} />
              </View>
              <View style={styles.setupText}>
                <Text style={styles.setupTitle}>Lock distracting apps</Text>
                <Text style={styles.setupSub}>
                  Choose which apps require a stretch
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          </Animated.View>
        )}

        {/* Browse library */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)}>
          <Pressable
            style={styles.libraryCard}
            onPress={() => router.navigate("/stretches")}
          >
            <View style={[styles.setupIcon, { backgroundColor: Colors.primaryMuted }]}>
              <Ionicons name="body-outline" size={22} color={Colors.primary} />
            </View>
            <View style={styles.setupText}>
              <Text style={styles.setupTitle}>Browse stretch library</Text>
              <Text style={styles.setupSub}>12 stretches for every area</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        </Animated.View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
    marginBottom: 2,
  },
  headline: {
    fontSize: 26,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  streakNum: {
    fontSize: 15,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.accent,
  },
  quickBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  quickBtnLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  quickBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickBtnTitle: {
    fontSize: 17,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.textInverted,
    marginBottom: 2,
  },
  quickBtnSub: {
    fontSize: 12,
    fontFamily: "DM_Sans_400Regular",
    color: "rgba(13,31,26,0.6)",
  },
  quickBtnArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: 9, marginBottom: 14 },
  statPill: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 5,
  },
  statPillAccent: { backgroundColor: Colors.accentMuted },
  statValue: {
    fontSize: 21,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
  },
  statValueAccent: { color: Colors.accent },
  statLabel: {
    fontSize: 10,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.text,
  },
  cardMeta: {
    fontSize: 13,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textSecondary,
  },
  cardLink: {
    fontSize: 13,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.primary,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
    marginBottom: 12,
    lineHeight: 17,
  },
  goalDoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  goalDoneText: {
    fontSize: 11,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.textInverted,
  },
  progressTrack: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", borderRadius: 3 },
  progressHint: {
    fontSize: 12,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
  },
  appsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  appChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.bgCardAlt,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  appChipText: {
    fontSize: 12,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textSecondary,
  },
  setupCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  libraryCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  setupIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  setupText: { flex: 1 },
  setupTitle: {
    fontSize: 14,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.text,
    marginBottom: 2,
  },
  setupSub: {
    fontSize: 12,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
  },
});
