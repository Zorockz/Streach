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
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { STRETCHES, getRandomStretch } from "@/constants/stretches";
import { useApp } from "@/context/AppContext";

type Phase = "ready" | "running" | "done";
type Breath = "in" | "hold" | "out";

const BREATH_CYCLE = { in: 4000, hold: 2000, out: 5000 };

function BreathingOrb({
  isRunning,
  phase,
}: {
  isRunning: boolean;
  phase: Breath;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    if (!isRunning) {
      scale.value = withTiming(1, { duration: 600 });
      opacity.value = withTiming(0.55, { duration: 600 });
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1.32, {
          duration: BREATH_CYCLE.in,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1.32, {
          duration: BREATH_CYCLE.hold,
          easing: Easing.linear,
        }),
        withTiming(1, {
          duration: BREATH_CYCLE.out,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, {
          duration: BREATH_CYCLE.in,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.85, {
          duration: BREATH_CYCLE.hold,
          easing: Easing.linear,
        }),
        withTiming(0.45, {
          duration: BREATH_CYCLE.out,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  }, [isRunning]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [1, 1.32], [1, 1.14]) }],
    opacity: interpolate(scale.value, [1, 1.32], [0.15, 0.3]),
  }));

  const breathColors = {
    in: Colors.primaryLight,
    hold: Colors.primary,
    out: Colors.bgCard,
  };

  return (
    <View style={orb.container}>
      {/* Outer glow */}
      <Animated.View style={[orb.outer, outerStyle]} />
      {/* Core */}
      <Animated.View
        style={[
          orb.core,
          orbStyle,
          isRunning && { backgroundColor: breathColors[phase] },
        ]}
      />
      {/* Center icon */}
      <View style={orb.iconLayer} pointerEvents="none">
        <Ionicons
          name="body-outline"
          size={32}
          color={
            isRunning ? Colors.textInverted : Colors.textSecondary
          }
        />
      </View>
    </View>
  );
}

const orb = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  outer: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primary,
  },
  core: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primaryMuted,
  },
  iconLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default function StretchSessionScreen() {
  const { stretchId, targetApp } = useLocalSearchParams<{
    stretchId?: string;
    targetApp?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { recordSession } = useApp();

  const stretch = stretchId
    ? STRETCHES.find((s) => s.id === stretchId)
    : getRandomStretch();

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
    if (Platform.OS !== "web")
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        if (Platform.OS !== "web")
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 500);
  };

  const handleComplete = async () => {
    if (!stretch) return;
    await recordSession({
      stretchId: stretch.id,
      stretchName: stretch.name,
      durationSeconds: duration,
      targetApp: targetApp,
    });
    router.back();
  };

  const handleSkip = async () => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    clearTimers();
    router.back();
  };

  const handleEarlyComplete = async () => {
    if (!stretch) return;
    clearTimers();
    setPhase("done");
    if (Platform.OS !== "web")
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  useEffect(() => () => clearTimers(), []);

  if (!stretch) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text }}>Stretch not found</Text>
      </View>
    );
  }

  const breathLabel =
    phase === "running"
      ? breathPhase === "in"
        ? "Breathe in"
        : breathPhase === "hold"
          ? "Hold"
          : "Breathe out"
      : phase === "ready"
        ? "Tap to begin"
        : "Well done!";

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}`;
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? 67 : insets.top,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom,
        },
      ]}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={handleSkip}>
          <Ionicons name="close" size={20} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{stretch.name}</Text>
          {targetApp && (
            <View style={styles.headerTag}>
              <Ionicons name="lock-open-outline" size={11} color={Colors.accent} />
              <Text style={styles.headerTagText}>Unlocks {targetApp}</Text>
            </View>
          )}
        </View>
        {phase === "running" && (
          <Pressable onPress={handleEarlyComplete} style={styles.earlyBtn}>
            <Text style={styles.earlyBtnText}>Done</Text>
          </Pressable>
        )}
        {phase !== "running" && <View style={{ width: 60 }} />}
      </View>

      {/* Progress ring (simple arc using rotation trick) */}
      {phase === "running" && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.progressWrap}
        >
          <View style={styles.progressTrackOuter}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.timerLabel}>{formatTime(remaining)}</Text>
        </Animated.View>
      )}

      {/* Orb */}
      <View style={styles.orbSection}>
        <BreathingOrb isRunning={phase === "running"} phase={breathPhase} />
        <Animated.Text
          key={breathLabel}
          entering={FadeIn.duration(400)}
          style={[
            styles.breathLabel,
            phase === "done" && { color: Colors.primary },
          ]}
        >
          {breathLabel}
        </Animated.Text>
      </View>

      {/* Instructions */}
      {stretch.instructions && stretch.instructions.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.instrCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 120 }}
          >
            {stretch.instructions.map((step, i) => (
              <View key={i} style={styles.instrRow}>
                <View style={styles.instrDot} />
                <Text style={styles.instrText}>{step}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Footer CTAs */}
      <View style={styles.footer}>
        {phase === "ready" && (
          <Animated.View entering={FadeInDown.duration(400)} style={{ width: "100%", gap: 10 }}>
            <Pressable style={styles.startBtn} onPress={handleStart}>
              <Ionicons name="play" size={20} color={Colors.textInverted} />
              <Text style={styles.startBtnText}>
                Begin · {formatTime(duration)}
              </Text>
            </Pressable>
            <Pressable style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipBtnText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        )}

        {phase === "running" && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.runningHint}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.runningHintText}>
              Follow the orb — breathe with it
            </Text>
          </Animated.View>
        )}

        {phase === "done" && (
          <Animated.View entering={FadeInDown.duration(500)} style={{ width: "100%", gap: 12 }}>
            <View style={styles.doneRow}>
              <Ionicons name="checkmark-circle" size={28} color={Colors.primary} />
              <Text style={styles.doneTitle}>Great stretch!</Text>
            </View>
            {targetApp && (
              <View style={styles.unlockNote}>
                <Ionicons name="lock-open-outline" size={14} color={Colors.accent} />
                <Text style={styles.unlockText}>{targetApp} is now unlocked</Text>
              </View>
            )}
            <Pressable style={styles.completeBtn} onPress={handleComplete}>
              <Ionicons name="checkmark" size={20} color={Colors.textInverted} />
              <Text style={styles.completeBtnText}>Log & finish</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 15,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.text,
  },
  headerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  headerTagText: {
    fontSize: 11,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.accent,
  },
  earlyBtn: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  earlyBtnText: {
    fontSize: 14,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textSecondary,
  },
  progressWrap: { width: "100%", paddingHorizontal: 32, marginVertical: 6 },
  progressTrackOuter: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  timerLabel: {
    fontSize: 13,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  orbSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  breathLabel: {
    fontSize: 22,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: -0.2,
  },
  instrCard: {
    width: "100%",
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  instrRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 7,
  },
  instrDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
    flexShrink: 0,
  },
  instrText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 10,
    alignItems: "center",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
    width: "100%",
  },
  startBtnText: {
    fontSize: 17,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.textInverted,
  },
  skipBtn: { alignItems: "center", paddingVertical: 10, width: "100%" },
  skipBtnText: {
    fontSize: 14,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
  },
  runningHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
  },
  runningHintText: {
    fontSize: 13,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
  },
  doneRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center" },
  doneTitle: {
    fontSize: 22,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
  },
  unlockNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Colors.accentMuted,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: "center",
  },
  unlockText: {
    fontSize: 13,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.accent,
  },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
    width: "100%",
  },
  completeBtnText: {
    fontSize: 17,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.textInverted,
  },
});
