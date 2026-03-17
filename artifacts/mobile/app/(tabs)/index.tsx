import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
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
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { getRandomStretch } from "@/constants/stretches";
import { DISTRACTING_APPS } from "@/constants/stretches";

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={20} color={Colors.primaryLight} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickStretchButton() {
  const scale = useSharedValue(1);
  const { settings, recordSession } = useApp();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 12 })
    );
    const stretch = getRandomStretch(settings.focusBodyAreas);
    router.push({ pathname: '/stretch/session', params: { stretchId: stretch.id } });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable style={styles.quickStretchBtn} onPress={handlePress}>
        <View style={styles.quickStretchInner}>
          <Ionicons name="body-outline" size={28} color={Colors.primaryDeep} />
          <Text style={styles.quickStretchText}>Start a Stretch</Text>
          <Text style={styles.quickStretchSub}>30 seconds · Feel better now</Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={32} color={Colors.primaryDeep} />
      </Pressable>
    </Animated.View>
  );
}

function AppBadge({ app }: { app: typeof DISTRACTING_APPS[0] }) {
  return (
    <View style={styles.appBadge}>
      <Ionicons name={app.icon as any} size={16} color={Colors.textSecondary} />
      <Text style={styles.appBadgeName}>{app.name}</Text>
      <View style={styles.lockDot} />
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { settings, todayCount, currentStreak, totalSessions } = useApp();
  const lockedApps = DISTRACTING_APPS.filter(a => settings.lockedApps.includes(a.id));

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : 0;

  const dailyProgress = Math.min(todayCount / settings.dailyGoal, 1);
  const goalMet = todayCount >= settings.dailyGoal;

  return (
    <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good {getTimeOfDay()}</Text>
              <Text style={styles.headline}>Ready to stretch?</Text>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={18} color={Colors.accentWarm} />
              <Text style={styles.streakCount}>{currentStreak}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)}>
          <QuickStretchButton />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.statsRow}>
          <StatCard label="Today" value={todayCount} icon="checkmark-circle-outline" />
          <StatCard label="Streak" value={`${currentStreak}d`} icon="flame-outline" />
          <StatCard label="Total" value={totalSessions} icon="trophy-outline" />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(400)}>
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.sectionTitle}>Daily Goal</Text>
              {goalMet && (
                <View style={styles.goalMetBadge}>
                  <Ionicons name="checkmark" size={12} color={Colors.primaryDeep} />
                  <Text style={styles.goalMetText}>Done!</Text>
                </View>
              )}
            </View>
            <Text style={styles.goalSub}>{todayCount} of {settings.dailyGoal} stretches</Text>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: `${dailyProgress * 100}%` as any },
                  goalMet && { backgroundColor: Colors.accentWarm },
                ]}
              />
            </View>
          </View>
        </Animated.View>

        {lockedApps.length > 0 && (
          <Animated.View entering={FadeInDown.duration(600).delay(500)}>
            <View style={styles.lockedSection}>
              <Text style={styles.sectionTitle}>Locked Apps</Text>
              <Text style={styles.sectionSub}>Stretch to unlock these</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.appsRow}
              >
                {lockedApps.map(app => (
                  <AppBadge key={app.id} app={app} />
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        )}

        {lockedApps.length === 0 && (
          <Animated.View entering={FadeInDown.duration(600).delay(500)}>
            <Pressable
              style={styles.setupCard}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="lock-closed-outline" size={24} color={Colors.accentWarm} />
              <View style={styles.setupCardText}>
                <Text style={styles.setupCardTitle}>Set Up App Locks</Text>
                <Text style={styles.setupCardSub}>Choose which apps require a stretch to unlock</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </Pressable>
          </Animated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  headline: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    lineHeight: 34,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 168, 107, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  streakCount: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.accentWarm,
  },
  quickStretchBtn: {
    backgroundColor: Colors.softMint,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickStretchInner: {
    gap: 4,
  },
  quickStretchText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.primaryDeep,
  },
  quickStretchSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#2D5E3A',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  goalMetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.softMint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  goalMetText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primaryDeep,
  },
  goalSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    marginBottom: 12,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryLight,
    borderRadius: 3,
  },
  lockedSection: {
    marginBottom: 16,
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  appsRow: {
    gap: 8,
    paddingBottom: 4,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  appBadgeName: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  lockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentWarm,
  },
  setupCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  setupCardText: {
    flex: 1,
  },
  setupCardTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 2,
  },
  setupCardSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
