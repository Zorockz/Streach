import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { StretchIcon } from "@/components/StretchIcon";
import { STRETCHES, STRETCH_CATEGORIES, getRandomStretch } from "@/constants/stretches";
import { useApp } from "@/context/AppContext";

// Module-level — must never be inside a render/component function
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Phase = "ready" | "running" | "done";
type Breath = "in" | "hold" | "out";

const BREATH_CYCLE = { in: 4000, hold: 2000, out: 5000 };
const BREATH_LABEL: Record<Breath, string> = {
  in: "Breathe in",
  hold: "Hold",
  out: "Breathe out",
};

// ── Progress ring (sits behind the orb) ───────────────────────────────
const RING_R = 116;
const RING_CIRC = 2 * Math.PI * RING_R;
const RING_SIZE = 260;

function TimerRing({ progress }: { progress: number }) {
  const animProg = useSharedValue(0);

  useEffect(() => {
    animProg.value = withTiming(progress, {
      duration: 600,
      easing: Easing.linear,
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRC * (1 - animProg.value),
  }));

  const center = RING_SIZE / 2;

  return (
    <Svg
      width={RING_SIZE}
      height={RING_SIZE}
      style={{ position: "absolute" }}
    >
      <Circle
        cx={center} cy={center} r={RING_R}
        fill="none"
        stroke="rgba(58,122,92,0.12)"
        strokeWidth={6}
      />
      <AnimatedCircle
        cx={center} cy={center} r={RING_R}
        fill="none"
        stroke={Colors.primary}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={RING_CIRC}
        animatedProps={animatedProps}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </Svg>
  );
}

// ── Breathing orb — countdown number lives inside it ──────────────────
function BreathingOrb({
  isRunning,
  phase,
  mciIcon,
  countdown,
}: {
  isRunning: boolean;
  phase: Breath;
  mciIcon: string;
  countdown?: string;
}) {
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
        withTiming(1.3, { duration: BREATH_CYCLE.in, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.3, { duration: BREATH_CYCLE.hold }),
        withTiming(1, { duration: BREATH_CYCLE.out, easing: Easing.inOut(Easing.ease) })
      ),
      -1, false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: BREATH_CYCLE.in }),
        withTiming(0.75, { duration: BREATH_CYCLE.hold }),
        withTiming(0.3, { duration: BREATH_CYCLE.out })
      ),
      -1, false
    );
  }, [isRunning]);

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [1, 1.3], [1, 1.1]) }],
    opacity: interpolate(scale.value, [1, 1.3], [0.08, 0.18]),
  }));

  const fillColor = isRunning
    ? phase === "in"
      ? Colors.primary
      : phase === "hold"
      ? Colors.primaryDark
      : Colors.bgSurface
    : Colors.bgCard;

  const iconColor = isRunning && phase !== "out" ? Colors.white : Colors.textSecondary;

  return (
    <View style={orb.wrap}>
      <Animated.View style={[orb.outer, outerStyle]} />
      <Animated.View style={[orb.inner, innerStyle, { backgroundColor: fillColor }]} />
      <View style={orb.center} pointerEvents="none">
        {countdown ? (
          <Text style={[orb.countdown, { color: iconColor }]}>{countdown}</Text>
        ) : (
          <MaterialCommunityIcons
            name={mciIcon as any}
            size={46}
            color={iconColor}
          />
        )}
      </View>
    </View>
  );
}

const orb = StyleSheet.create({
  wrap: {
    width: 210, height: 210,
    alignItems: "center", justifyContent: "center",
  },
  outer: {
    position: "absolute", width: 230, height: 230, borderRadius: 115,
    backgroundColor: Colors.primary,
  },
  inner: {
    position: "absolute", width: 170, height: 170, borderRadius: 85,
  },
  center: {
    position: "absolute",
    alignItems: "center", justifyContent: "center",
  },
  countdown: {
    fontSize: 44,
    fontFamily: "DM_Sans_700Bold",
    letterSpacing: -2,
    lineHeight: 48,
  },
});

// ─── Main screen ───────────────────────────────────────────────────────
export default function StretchSessionScreen() {
  const { stretchId, targetApp, targetAppId } = useLocalSearchParams<{
    stretchId?: string;
    targetApp?: string;
    targetAppId?: string;
  }>();
  const { settings, recordSession } = useApp();

  const stretch = stretchId
    ? STRETCHES.find(s => s.id === stretchId)
    : getRandomStretch();
  const cat = stretch
    ? STRETCH_CATEGORIES.find(c => c.id === stretch.bodyArea[0])
    : null;

  const [phase, setPhase] = useState<Phase>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [breathPhase, setBreathPhase] = useState<Breath>("in");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const duration = stretch?.durationSeconds ?? 30;

  const remaining = Math.max(0, duration - elapsed);
  const progress = Math.min(elapsed / duration, 1);

  const instrCount = stretch?.instructions.length ?? 1;
  const instrIndex =
    phase === "running"
      ? Math.min(Math.floor((elapsed / duration) * instrCount), instrCount - 1)
      : 0;

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

    // Lift OS-level restriction if this was a gated-app session (15 min window)
    if (targetApp) {
      try {
        const { StretchGateNative } = await import('@/native/StretchGateNative');
        StretchGateNative.liftRestrictions(15);
      } catch (e) {
        console.warn('[SGNative] liftRestrictions error:', e);
      }
    }

    await recordSession({
      stretchId: stretch.id,
      stretchName: stretch.name,
      durationSeconds: elapsed,
      targetApp,
    });

    router.back();
  };

  const handleEarlyDone = () => {
    if (elapsed < 10) return;
    clearTimers();
    setPhase("done");
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  useEffect(() => () => clearTimers(), []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${s}`;
  };

  if (!stretch) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <Text style={{ color: Colors.text }}>Stretch not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
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
        ) : (
          <View style={{ width: 72 }} />
        )}
      </View>

      {/* ── Category + duration row ── */}
      <View style={styles.metaRow}>
        {cat && (
          <View style={[styles.catChip, { backgroundColor: cat.bgColor }]}>
            <StretchIcon
              mciIcon={cat.mciIcon}
              size={12}
              color={cat.color}
              bgColor="transparent"
              boxSize={15}
            />
            <Text style={[styles.catChipText, { color: cat.color }]}>
              {cat.label}
            </Text>
          </View>
        )}
        {phase === "ready" && (
          <View style={styles.durChip}>
            <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.durChipText}>{formatTime(duration)}s</Text>
          </View>
        )}
      </View>

      {/* ── Orb + ring (the only timer) ── */}
      <View style={styles.orbSection}>
        <View style={styles.orbContainer}>
          {phase === "running" && <TimerRing progress={progress} />}
          <BreathingOrb
            isRunning={phase === "running"}
            phase={breathPhase}
            mciIcon={stretch.mciIcon}
            countdown={phase === "running" ? formatTime(remaining) : undefined}
          />
        </View>

        {/* Breath cue / phase label */}
        <Animated.Text
          key={phase === "running" ? breathPhase : phase}
          entering={FadeIn.duration(350)}
          style={[
            styles.breathLabel,
            phase === "done" && styles.breathLabelDone,
          ]}
        >
          {phase === "ready"
            ? "Tap below to begin"
            : phase === "done"
            ? "Well done!"
            : BREATH_LABEL[breathPhase]}
        </Animated.Text>
      </View>

      {/* ── Auto-advancing instruction ── */}
      {stretch.instructions.length > 0 && phase !== "done" && (
        <View style={styles.instrWrap}>
          <Animated.Text
            key={instrIndex}
            entering={FadeInUp.duration(350)}
            style={styles.instrText}
          >
            {stretch.instructions[instrIndex]}
          </Animated.Text>
          <View style={styles.instrDots}>
            {stretch.instructions.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.instrDot,
                  i === instrIndex && styles.instrDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* ── Footer ── */}
      <View style={styles.footer}>
        {phase === "ready" && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={{ gap: 10, width: "100%" }}
          >
            <Pressable style={styles.startBtn} onPress={handleStart}>
              <Ionicons name="play" size={20} color={Colors.white} />
              <Text style={styles.startBtnText}>
                Begin \u00b7 {formatTime(duration)}s
              </Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        )}

        {phase === "running" && (
          <Animated.View
            entering={FadeIn.duration(500)}
            style={styles.runHint}
          >
            <Ionicons name="leaf-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.runHintText}>
              Follow the orb \u00b7 breathe with it
            </Text>
          </Animated.View>
        )}

        {phase === "done" && (
          <Animated.View
            entering={FadeInDown.duration(450)}
            style={{ gap: 12, width: "100%" }}
          >
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
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.bgCard,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.divider,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerName: {
    fontSize: 16,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.text,
  },
  headerTag: {
    flexDirection: "row", alignItems: "center",
    gap: 4, marginTop: 2,
  },
  headerTagText: {
    fontSize: 11,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.accent,
  },
  earlyBtn: { width: 72, alignItems: "flex-end" },
  earlyBtnText: {
    fontSize: 13,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textSecondary,
  },
  metaRow: {
    width: "100%",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  catChip: {
    flexDirection: "row", alignItems: "center",
    gap: 5, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14,
  },
  catChipText: {
    fontSize: 12,
    fontFamily: "DM_Sans_500Medium",
  },
  durChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.divider,
  },
  durChipText: {
    fontSize: 12,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.textSecondary,
  },
  orbSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  orbContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  breathLabel: {
    fontSize: 20,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  breathLabelDone: {
    color: Colors.primary,
    fontFamily: "DM_Sans_700Bold",
    fontSize: 24,
  },
  instrWrap: {
    width: "100%",
    paddingHorizontal: 24,
    marginBottom: 12,
    alignItems: "center",
  },
  instrText: {
    fontSize: 15,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  instrDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
  },
  instrDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: Colors.bgSurface,
  },
  instrDotActive: {
    backgroundColor: Colors.primary,
    width: 14,
  },
  footer: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 4,
    alignItems: "center",
  },
  startBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16, paddingVertical: 17,
    gap: 10, width: "100%",
  },
  startBtnText: {
    fontSize: 17,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.white,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 10,
    width: "100%",
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
  },
  runHint: {
    flexDirection: "row", alignItems: "center",
    gap: 6, paddingVertical: 14,
  },
  runHintText: {
    fontSize: 13,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
  },
});
