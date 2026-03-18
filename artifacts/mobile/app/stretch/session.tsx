import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { StretchIcon } from "@/components/StretchIcon";
import { STRETCHES, STRETCH_CATEGORIES, getRandomStretch } from "@/constants/stretches";
import { useApp } from "@/context/AppContext";

type Phase = "ready" | "running" | "done";
type Breath = "in" | "hold" | "out";

const BREATH_CYCLE = { in: 4000, hold: 2000, out: 5000 };
const BREATH_LABEL: Record<Breath, string> = { in: "Breathe in", hold: "Hold", out: "Breathe out" };

function BreathingOrb({ isRunning, phase }: { isRunning: boolean; phase: Breath }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    if (!isRunning) {
      scale.value = withTiming(1, { duration: 600 });
      opacity.value = withTiming(0.35, { duration: 600 });
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: BREATH_CYCLE.in, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.35, { duration: BREATH_CYCLE.hold }),
        withTiming(1, { duration: BREATH_CYCLE.out, easing: Easing.inOut(Easing.ease) })
      ), -1, false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: BREATH_CYCLE.in }),
        withTiming(0.7, { duration: BREATH_CYCLE.hold }),
        withTiming(0.3, { duration: BREATH_CYCLE.out })
      ), -1, false
    );
  }, [isRunning]);

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [1, 1.35], [1, 1.12]) }],
    opacity: interpolate(scale.value, [1, 1.35], [0.1, 0.22]),
  }));

  const fillColor = isRunning
    ? phase === "in" ? Colors.primary
      : phase === "hold" ? Colors.primaryDark
      : Colors.bgSurface
    : Colors.bgCard;

  return (
    <View style={orb.wrap}>
      <Animated.View style={[orb.outer, outerStyle]} />
      <Animated.View style={[orb.inner, innerStyle, { backgroundColor: fillColor }]} />
      <View style={orb.iconWrap} pointerEvents="none">
        <Ionicons
          name="body-outline" size={36}
          color={isRunning && phase !== "out" ? Colors.white : Colors.textSecondary}
        />
      </View>
    </View>
  );
}

const orb = StyleSheet.create({
  wrap: { width: 200, height: 200, alignItems: "center", justifyContent: "center" },
  outer: {
    position: "absolute", width: 220, height: 220, borderRadius: 110,
    backgroundColor: Colors.primary,
  },
  inner: {
    position: "absolute", width: 160, height: 160, borderRadius: 80,
  },
  iconWrap: { position: "absolute", alignItems: "center", justifyContent: "center" },
});

export default function StretchSessionScreen() {
  const { stretchId, targetApp } = useLocalSearchParams<{ stretchId?: string; targetApp?: string }>();
  const { recordSession } = useApp();

  const stretch = stretchId ? STRETCHES.find(s => s.id === stretchId) : getRandomStretch();
  const cat = stretch ? STRETCH_CATEGORIES.find(c => c.id === stretch.bodyArea[0]) : null;

  const [phase, setPhase] = useState<Phase>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [breathPhase, setBreathPhase] = useState<Breath>("in");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const duration = stretch?.durationSeconds ?? 30;

  const remaining = Math.max(0, duration - elapsed);
  const progress = Math.min(elapsed / duration, 1);

  const clearTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
  };

  const runBreathCycle = useCallback(() => {
    const cycle = () => {
      setBreathPhase("in");
      breathTimerRef.current = setTimeout(() => {
        setBreathPhase("hold");
        breathTimerRef.current = setTimeout(() => {
          setBreathPhase("out");
          breathTimerRef.current = setTimeout(cycle, BREATH_CYCLE.out);
        }, BREATH_CYCLE.hold);
      }, BREATH_CYCLE.in);
    };
    cycle();
  }, []);

  const handleStart = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("running");
    setElapsed(0);
    startTimeRef.current = Date.now();
    runBreathCycle();
    intervalRef.current = setInterval(() => {
      const el = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(el);
      if (el >= duration) {
        clearTimers();
        setPhase("done");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 500);
  };

  const handleComplete = async () => {
    if (!stretch) return;
    await recordSession({
      stretchId: stretch.id,
      stretchName: stretch.name,
      durationSeconds: duration,
      targetApp,
    });
    router.back();
  };

  const handleEarlyDone = () => {
    clearTimers();
    setPhase("done");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  useEffect(() => () => clearTimers(), []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}`;
  };

  if (!stretch) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: Colors.text }}>Stretch not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={18} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{stretch.name}</Text>
          {targetApp && (
            <View style={styles.headerTag}>
              <Ionicons name="lock-open-outline" size={10} color={Colors.accent} />
              <Text style={styles.headerTagText}>Unlocks {targetApp}</Text>
            </View>
          )}
        </View>
        {phase === "running" ? (
          <Pressable style={styles.earlyBtn} onPress={handleEarlyDone}>
            <Text style={styles.earlyBtnText}>Done early</Text>
          </Pressable>
        ) : <View style={{ width: 72 }} />}
      </View>

      {/* Category + timer */}
      <View style={styles.subHeader}>
        {cat && (
          <View style={[styles.catChip, { backgroundColor: cat.bgColor }]}>
            <StretchIcon mciIcon={cat.mciIcon} size={13} color={cat.color} bgColor="transparent" boxSize={16} />
            <Text style={[styles.catChipText, { color: cat.color }]}>{cat.label}</Text>
          </View>
        )}
        {phase === "running" && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.timerChip}>
            <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.timerChipText}>{formatTime(remaining)}</Text>
          </Animated.View>
        )}
      </View>

      {/* Progress bar */}
      {phase === "running" && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      )}

      {/* Orb */}
      <View style={styles.orbSection}>
        <BreathingOrb isRunning={phase === "running"} phase={breathPhase} />
        <Animated.Text
          key={phase === "running" ? breathPhase : phase}
          entering={FadeIn.duration(400)}
          style={[
            styles.breathLabel,
            phase === "done" && { color: Colors.primary, fontFamily: "DM_Sans_700Bold" },
          ]}
        >
          {phase === "ready" ? "Tap below to begin"
            : phase === "done" ? "Well done!"
            : BREATH_LABEL[breathPhase]}
        </Animated.Text>
      </View>

      {/* Instruction cards */}
      {stretch.instructions.length > 0 && phase !== "done" && (
        <View style={styles.instrWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            {stretch.instructions.map((step, i) => (
              <View key={i} style={styles.instrCard}>
                <Text style={styles.instrNumText}>{i + 1}</Text>
                <Text style={styles.instrText}>{step}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Footer CTAs */}
      <View style={styles.footer}>
        {phase === "ready" && (
          <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 10, width: "100%" }}>
            <Pressable style={styles.startBtn} onPress={handleStart}>
              <Ionicons name="play" size={20} color={Colors.white} />
              <Text style={styles.startBtnText}>Begin · {formatTime(duration)}</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        )}
        {phase === "running" && (
          <View style={styles.runHint}>
            <Ionicons name="leaf-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.runHintText}>Follow the orb · breathe with it</Text>
          </View>
        )}
        {phase === "done" && (
          <Animated.View entering={FadeInDown.duration(450)} style={{ gap: 12, width: "100%" }}>
            {targetApp && (
              <View style={styles.unlockBadge}>
                <Ionicons name="lock-open-outline" size={14} color={Colors.accent} />
                <Text style={styles.unlockText}>{targetApp} is now unlocked</Text>
              </View>
            )}
            <Pressable style={styles.startBtn} onPress={handleComplete}>
              <Ionicons name="checkmark" size={20} color={Colors.white} />
              <Text style={styles.startBtnText}>Log session &amp; finish</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, alignItems: "center" },
  header: {
    width: "100%", flexDirection: "row",
    alignItems: "center", paddingHorizontal: 16, paddingVertical: 10,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.bgCard, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.divider,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerName: { fontSize: 15, fontFamily: "DM_Sans_600SemiBold", color: Colors.text },
  headerTag: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerTagText: { fontSize: 11, fontFamily: "DM_Sans_400Regular", color: Colors.accent },
  earlyBtn: { width: 72, alignItems: "flex-end" },
  earlyBtnText: { fontSize: 13, fontFamily: "DM_Sans_500Medium", color: Colors.textSecondary },
  subHeader: {
    width: "100%", paddingHorizontal: 16, flexDirection: "row",
    alignItems: "center", gap: 8, marginBottom: 6,
  },
  catChip: {
    flexDirection: "row", alignItems: "center",
    gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14,
  },
  catChipText: { fontSize: 12, fontFamily: "DM_Sans_500Medium" },
  timerChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.bgCard, paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.divider,
  },
  timerChipText: { fontSize: 13, fontFamily: "DM_Sans_600SemiBold", color: Colors.textSecondary },
  progressWrap: { width: "100%", paddingHorizontal: 20, marginBottom: 4 },
  progressTrack: { height: 3, backgroundColor: Colors.bgSurface, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 2 },
  orbSection: { flex: 1, alignItems: "center", justifyContent: "center", gap: 24 },
  breathLabel: {
    fontSize: 22, fontFamily: "DM_Sans_600SemiBold",
    color: Colors.textSecondary, letterSpacing: -0.2,
  },
  instrWrap: { width: "100%", paddingLeft: 20, marginBottom: 8 },
  instrCard: {
    backgroundColor: Colors.bgCard, borderRadius: 12, padding: 12,
    marginRight: 10, width: 200,
    borderWidth: 1, borderColor: Colors.divider,
  },
  instrNumText: { fontSize: 11, fontFamily: "DM_Sans_700Bold", color: Colors.primary, marginBottom: 4 },
  instrText: { fontSize: 12, fontFamily: "DM_Sans_400Regular", color: Colors.textSecondary, lineHeight: 17 },
  footer: { width: "100%", paddingHorizontal: 24, paddingBottom: 8, alignItems: "center" },
  startBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", backgroundColor: Colors.primary,
    borderRadius: 16, paddingVertical: 16, gap: 10, width: "100%",
  },
  startBtnText: { fontSize: 17, fontFamily: "DM_Sans_700Bold", color: Colors.white },
  cancelBtn: { alignItems: "center", paddingVertical: 10, width: "100%" },
  cancelBtnText: { fontSize: 14, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },
  runHint: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 14,
  },
  runHintText: { fontSize: 13, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },
  unlockBadge: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: Colors.accentMuted, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9, alignSelf: "center",
  },
  unlockText: { fontSize: 13, fontFamily: "DM_Sans_500Medium", color: Colors.accent },
});
