import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import Reanimated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import {
  DISTRACTING_APPS,
  STRETCH_CATEGORIES,
  BodyArea,
} from "@/constants/stretches";
import { useApp } from "@/context/AppContext";
import {
  requestReminderPermissions,
  syncStretchReminderNotifications,
} from "@/services/notifications";
import type { ReminderTime as ServiceReminderTime } from "@/services/notifications";

const TOTAL_STEPS = 16;

// ─── Shared Next Button ───────────────────────────────────────────────────────
function NextButton({
  label = "Next",
  onPress,
  loading = false,
  disabled = false,
}: {
  label?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const { bottom } = useSafeAreaInsets();
  const handlePress = async () => {
    if (Platform.OS !== "web")
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };
  return (
    <View style={[sh.nextWrap, { paddingBottom: Math.max(bottom + 16, 36) }]}>
      <Pressable
        style={[sh.nextBtn, (loading || disabled) && { opacity: 0.5 }]}
        onPress={handlePress}
        disabled={loading || disabled}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <Text style={sh.nextBtnText}>{label}</Text>
        )}
      </Pressable>
    </View>
  );
}

// ─── Step 0: Cinematic Splash ─────────────────────────────────────────────────
function SplashStep({
  onAdvance,
  canTap,
}: {
  onAdvance: () => void;
  canTap: boolean;
}) {
  const overlayOpacity = useSharedValue(1);
  const iconScale = useSharedValue(0.6);
  const iconOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(28);
  const taglineOpacity = useSharedValue(0);
  const chevronOpacity = useSharedValue(0);
  const chevronY = useSharedValue(0);

  useEffect(() => {
    overlayOpacity.value = withTiming(0, { duration: 1200 });
    iconOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
    iconScale.value = withDelay(
      1200,
      withSpring(1, { damping: 14, stiffness: 100 })
    );
    titleOpacity.value = withDelay(2000, withTiming(1, { duration: 600 }));
    titleY.value = withDelay(2000, withTiming(0, { duration: 600 }));
    taglineOpacity.value = withDelay(2800, withTiming(1, { duration: 600 }));
    chevronOpacity.value = withDelay(4000, withTiming(1, { duration: 400 }));
    const bounceTimer = setTimeout(() => {
      chevronY.value = withRepeat(
        withSequence(
          withTiming(7, { duration: 700 }),
          withTiming(0, { duration: 700 })
        ),
        -1,
        false
      );
    }, 4400);
    return () => clearTimeout(bounceTimer);
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const chevronStyle = useAnimatedStyle(() => ({
    opacity: chevronOpacity.value,
    transform: [{ translateY: chevronY.value }],
  }));

  return (
    <Pressable
      style={spl.container}
      onPress={() => { if (canTap) onAdvance(); }}
    >
      <Reanimated.View style={[spl.iconBox, iconStyle]}>
        <Ionicons name="leaf" size={72} color={Colors.primary} />
      </Reanimated.View>
      <Reanimated.Text style={[spl.title, titleStyle]}>StretchGate</Reanimated.Text>
      <Reanimated.Text style={[spl.tagline, taglineStyle]}>Earn your scroll.</Reanimated.Text>
      <Reanimated.View style={[spl.chevron, chevronStyle]}>
        <Ionicons name="chevron-down" size={26} color={Colors.textMuted} />
      </Reanimated.View>
      <Reanimated.View style={[spl.overlay, overlayStyle]} pointerEvents="none" />
    </Pressable>
  );
}

const spl = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBox: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    letterSpacing: -1.5,
    marginBottom: 14,
  },
  tagline: {
    fontSize: 18,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textSecondary,
  },
  chevron: { position: "absolute", bottom: 60 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0D1F1A",
  },
});

// ─── Shared Emotion Screen ────────────────────────────────────────────────────
function EmotionScreen({
  iconNode,
  iconAnim,
  headline,
  body,
  onNext,
}: {
  iconNode: React.ReactNode;
  iconAnim?: any;
  headline: string;
  body: string;
  onNext: () => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={em.iconArea}>
        <Reanimated.View style={iconAnim}>{iconNode}</Reanimated.View>
      </View>
      <View style={em.textArea}>
        <Reanimated.Text entering={FadeInDown.duration(500)} style={em.headline}>
          {headline}
        </Reanimated.Text>
        <Reanimated.Text entering={FadeInDown.duration(500).delay(120)} style={em.body}>
          {body}
        </Reanimated.Text>
      </View>
      <NextButton onPress={onNext} />
    </View>
  );
}

const em = StyleSheet.create({
  iconArea: { flex: 45, alignItems: "center", justifyContent: "center" },
  textArea: { flex: 42, paddingHorizontal: 32 },
  headline: {
    fontSize: 32,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 41,
    marginBottom: 18,
  },
  body: {
    fontSize: 16,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 25,
  },
});

// ─── Step 1: Problem ──────────────────────────────────────────────────────────
function ProblemStep({ onNext }: { onNext: () => void }) {
  const tilt = useSharedValue(0);
  useEffect(() => {
    tilt.value = withRepeat(
      withSequence(withTiming(-8, { duration: 1200 }), withTiming(8, { duration: 1200 })),
      -1, true
    );
  }, []);
  const tiltStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tilt.value}deg` }],
  }));
  return (
    <EmotionScreen
      iconNode={<Ionicons name="phone-portrait-outline" size={120} color={Colors.textMuted} />}
      iconAnim={tiltStyle}
      headline={"You open TikTok.\nThen 45 minutes disappear."}
      body={"It\u2019s not a willpower problem. It\u2019s a design problem. Your apps are built to keep you stuck."}
      onNext={onNext}
    />
  );
}

// ─── Step 2: Shift ────────────────────────────────────────────────────────────
function ShiftStep({ onNext }: { onNext: () => void }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 1000 }), withTiming(1.0, { duration: 1000 })),
      -1, true
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return (
    <EmotionScreen
      iconNode={<Ionicons name="body-outline" size={120} color={Colors.primary} />}
      iconAnim={pulseStyle}
      headline={"What if your body\nwas the password?"}
      body={"30 seconds of movement before you scroll. That\u2019s it. A tiny gate that changes everything."}
      onNext={onNext}
    />
  );
}

// ─── Step 3: Promise ──────────────────────────────────────────────────────────
function PromiseStep({ onNext }: { onNext: () => void }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 1000 }), withTiming(1.0, { duration: 1000 })),
      -1, true
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return (
    <EmotionScreen
      iconNode={<Ionicons name="leaf-outline" size={120} color={Colors.primary} />}
      iconAnim={pulseStyle}
      headline={"Move a little.\nScroll a lot less."}
      body={"StretchGate doesn\u2019t punish you. It just asks you to show up for your body first."}
      onNext={onNext}
    />
  );
}

// ─── Step 4: How It Works ─────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    icon: "phone-portrait-outline" as const,
    color: Colors.textMuted,
    title: "Open a distracting app",
    body: "You reach for TikTok, Instagram, or YouTube like always.",
  },
  {
    icon: "leaf-outline" as const,
    color: Colors.primary,
    title: "StretchGate appears",
    body: "A quick stretch prompt shows up. 20\u201360 seconds, guided and simple.",
  },
  {
    icon: "checkmark-circle-outline" as const,
    color: Colors.accent,
    title: "Move. Unlock. Scroll.",
    body: "You did something good for your body. Now enjoy your app guilt-free.",
  },
];

function HowItWorksStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={sh.stepHeader}>
        <Reanimated.Text entering={FadeInDown.duration(400)} style={sh.stepHeadline}>
          {"Here\u2019s how\nit works"}
        </Reanimated.Text>
      </View>
      <View style={{ paddingHorizontal: 24, gap: 14 }}>
        {HOW_STEPS.map((s, i) => (
          <Reanimated.View
            key={i}
            entering={FadeInDown.duration(400).delay(i * 120)}
            style={hw.card}
          >
            <View style={[hw.iconBox, { backgroundColor: s.color + "18" }]}>
              <Ionicons name={s.icon} size={30} color={s.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={hw.title}>{s.title}</Text>
              <Text style={hw.body}>{s.body}</Text>
            </View>
          </Reanimated.View>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <NextButton onPress={onNext} />
    </View>
  );
}

const hw = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    fontSize: 15,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});

// ─── Step 5: What You'll Gain ─────────────────────────────────────────────────
const GAINS = [
  {
    icon: "eye-outline" as const,
    label: "More presence",
    desc: "Break the autopilot loop that pulls you to your phone without thinking.",
  },
  {
    icon: "trending-down-outline" as const,
    label: "Less mindless scrolling",
    desc: "A tiny friction point reduces boredom scrolls by over 60% on average.",
  },
  {
    icon: "heart-outline" as const,
    label: "A body that feels good",
    desc: "Micro-stretches throughout the day reduce tension and improve your mood.",
  },
];

function WhatYouGainStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={sh.stepHeader}>
        <Reanimated.Text entering={FadeInDown.duration(400)} style={sh.stepHeadline}>
          {"What you\u2019ll\nactually gain"}
        </Reanimated.Text>
      </View>
      <View style={{ paddingHorizontal: 24, gap: 14 }}>
        {GAINS.map((g, i) => (
          <Reanimated.View
            key={i}
            entering={FadeInDown.duration(400).delay(i * 120)}
            style={wy.card}
          >
            <View style={wy.iconCircle}>
              <Ionicons name={g.icon} size={26} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={wy.label}>{g.label}</Text>
              <Text style={wy.desc}>{g.desc}</Text>
            </View>
          </Reanimated.View>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <NextButton onPress={onNext} />
    </View>
  );
}

const wy = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  label: {
    fontSize: 15,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});

// ─── Step 6: Focus Areas ──────────────────────────────────────────────────────
function FocusAreasStep({
  selected,
  setSelected,
  onNext,
}: {
  selected: BodyArea[];
  setSelected: (a: BodyArea[]) => void;
  onNext: () => void;
}) {
  const toggle = async (id: BodyArea) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    setSelected(
      selected.includes(id)
        ? selected.filter((a) => a !== id)
        : [...selected, id]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={sh.stepHeader}>
        <Reanimated.Text entering={FadeInDown.duration(400)} style={sh.stepHeadline}>
          {"Where do you\nhold tension?"}
        </Reanimated.Text>
        <Reanimated.Text entering={FadeInDown.duration(400).delay(80)} style={sh.stepSub}>
          {"We'll prioritize stretches for these areas."}
        </Reanimated.Text>
      </View>
      <View style={sh.pillGrid}>
        {STRETCH_CATEGORIES.map((cat) => {
          const on = selected.includes(cat.id);
          return (
            <Pressable
              key={cat.id}
              style={[
                sh.areaChip,
                on
                  ? { backgroundColor: Colors.primary, borderColor: Colors.primary }
                  : { backgroundColor: Colors.bgCard, borderColor: Colors.divider },
              ]}
              onPress={() => toggle(cat.id)}
            >
              <MaterialCommunityIcons
                name={cat.mciIcon as any}
                size={18}
                color={on ? Colors.white : Colors.textSecondary}
              />
              <Text style={[sh.areaChipText, { color: on ? Colors.white : Colors.textSecondary }]}>
                {cat.label.split(" ")[0]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      <NextButton onPress={onNext} />
    </View>
  );
}

// ─── Step 7: Duration ─────────────────────────────────────────────────────────
type DurOpt = 20 | 45 | 60;
const DUR_OPTIONS: { seconds: DurOpt; label: string; badge?: string }[] = [
  { seconds: 20, label: "Quick reset" },
  { seconds: 45, label: "Sweet spot", badge: "Popular" },
  { seconds: 60, label: "Deep stretch" },
];

function DurationStep({
  selected,
  setSelected,
  onNext,
}: {
  selected: DurOpt;
  setSelected: (d: DurOpt) => void;
  onNext: () => void;
}) {
  const choose = async (d: DurOpt) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    setSelected(d);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={sh.stepHeader}>
        <Reanimated.Text entering={FadeInDown.duration(400)} style={sh.stepHeadline}>
          {"How long can\nyou spare?"}
        </Reanimated.Text>
        <Reanimated.Text entering={FadeInDown.duration(400).delay(80)} style={sh.stepSub}>
          This is how long each stretch will take.
        </Reanimated.Text>
      </View>
      <View style={sh.durationList}>
        {DUR_OPTIONS.map((opt) => {
          const on = selected === opt.seconds;
          return (
            <Pressable
              key={opt.seconds}
              style={[sh.durCard, on && sh.durCardOn]}
              onPress={() => choose(opt.seconds)}
            >
              <Text style={[sh.durNum, on && { color: Colors.white }]}>
                {opt.seconds}
                <Text style={[sh.durUnit, on && { color: "rgba(255,255,255,0.7)" }]}>s</Text>
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[sh.durLabel, on && { color: Colors.white }]}>{opt.label}</Text>
                {opt.badge && (
                  <View style={[sh.durBadge, on && { backgroundColor: "rgba(255,255,255,0.22)" }]}>
                    <Text style={[sh.durBadgeText, on && { color: Colors.white }]}>{opt.badge}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      <NextButton onPress={onNext} />
    </View>
  );
}

// ─── Step 8: Daily Goal ───────────────────────────────────────────────────────
function DailyGoalStep({
  goal,
  setGoal,
  onNext,
}: {
  goal: number;
  setGoal: (n: number) => void;
  onNext: () => void;
}) {
  const numScale = useSharedValue(1);
  const numStyle = useAnimatedStyle(() => ({ transform: [{ scale: numScale.value }] }));

  const change = async (delta: number) => {
    const next = Math.max(1, Math.min(10, goal + delta));
    if (next === goal) return;
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    setGoal(next);
    numScale.value = withSequence(
      withSpring(1.28, { damping: 8, stiffness: 200 }),
      withSpring(1.0, { damping: 14, stiffness: 150 })
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={sh.stepHeader}>
        <Reanimated.Text entering={FadeInDown.duration(400)} style={sh.stepHeadline}>
          {"How many times\nper day?"}
        </Reanimated.Text>
        <Reanimated.Text entering={FadeInDown.duration(400).delay(80)} style={sh.stepSub}>
          Each stretch earns one unlock.
        </Reanimated.Text>
      </View>
      <View style={sh.goalPicker}>
        <Pressable
          style={[sh.goalCircle, goal <= 1 && { opacity: 0.3 }]}
          onPress={() => change(-1)}
          disabled={goal <= 1}
        >
          <Ionicons name="remove" size={28} color={Colors.text} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Reanimated.Text style={[sh.goalNum, numStyle]}>{goal}</Reanimated.Text>
          <Text style={sh.goalLabel}>stretches</Text>
        </View>
        <Pressable
          style={[sh.goalCircle, goal >= 10 && { opacity: 0.3 }]}
          onPress={() => change(1)}
          disabled={goal >= 10}
        >
          <Ionicons name="add" size={28} color={Colors.text} />
        </Pressable>
      </View>
      <View style={{ flex: 1 }} />
      <NextButton onPress={onNext} />
    </View>
  );
}

// ─── Step 9: Best Time to Move ────────────────────────────────────────────────
type ScrollTime = "Morning" | "Afternoon" | "Evening" | "Night";
const SCROLL_TIMES: { id: ScrollTime; icon: string; sub: string }[] = [
  { id: "Morning", icon: "sunny-outline", sub: "6 am \u2013 12 pm" },
  { id: "Afternoon", icon: "partly-sunny-outline", sub: "12 pm \u2013 5 pm" },
  { id: "Evening", icon: "moon-outline", sub: "5 pm \u2013 9 pm" },
  { id: "Night", icon: "star-outline", sub: "9 pm and later" },
];

function BestTimeStep({
  selected,
  setSelected,
  onNext,
}: {
  selected: ScrollTime[];
  setSelected: (t: ScrollTime[]) => void;
  onNext: () => void;
}) {
  const toggle = async (id: ScrollTime) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    setSelected(
      selected.includes(id)
        ? selected.filter((t) => t !== id)
        : [...selected, id]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={sh.stepHeader}>
        <Reanimated.Text entering={FadeInDown.duration(400)} style={sh.stepHeadline}>
          {"When do you\nscroll most?"}
        </Reanimated.Text>
        <Reanimated.Text entering={FadeInDown.duration(400).delay(80)} style={sh.stepSub}>
          {"We'll be ready when the urge hits."}
        </Reanimated.Text>
      </View>
      <View style={{ paddingHorizontal: 24, gap: 12 }}>
        {SCROLL_TIMES.map((t, i) => {
          const on = selected.includes(t.id);
          return (
            <Reanimated.View key={t.id} entering={FadeInDown.duration(350).delay(i * 80)}>
              <Pressable
                style={[bt.row, on && bt.rowOn]}
                onPress={() => toggle(t.id)}
              >
                <View style={[bt.iconBox, { backgroundColor: on ? "rgba(255,255,255,0.2)" : Colors.primaryMuted }]}>
                  <Ionicons name={t.icon as any} size={22} color={on ? Colors.white : Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[bt.label, on && { color: Colors.white }]}>{t.id}</Text>
                  <Text style={[bt.sub, on && { color: "rgba(255,255,255,0.7)" }]}>{t.sub}</Text>
                </View>
                <View style={[bt.check, on && { backgroundColor: "rgba(255,255,255,0.3)", borderColor: "transparent" }]}>
                  {on && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                </View>
              </Pressable>
            </Reanimated.View>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      <NextButton onPress={onNext} />
    </View>
  );
}

const bt = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  rowOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
  },
  sub: {
    fontSize: 12,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
    marginTop: 2,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Step 10: Honor System ────────────────────────────────────────────────────
function HonorSystemStep({ onNext }: { onNext: () => void }) {
  const ring = useSharedValue(1);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    ring.value = withRepeat(
      withSequence(
        withTiming(1.14, { duration: 1800 }),
        withTiming(1.0, { duration: 1800 })
      ),
      -1,
      true
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ring.value }],
    opacity: 1 - (ring.value - 1) * 5,
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleCommit = async () => {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    btnScale.value = withSequence(
      withSpring(0.93, { damping: 8 }),
      withSpring(1.0, { damping: 12 })
    );
    setTimeout(onNext, 250);
  };

  const { bottom } = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={hs.topArea}>
        <View style={hs.ringWrap}>
          <Reanimated.View style={[hs.ring, ringStyle]} />
          <View style={hs.shieldBox}>
            <Ionicons name="shield-checkmark-outline" size={56} color={Colors.primary} />
          </View>
        </View>
      </View>
      <View style={hs.textArea}>
        <Reanimated.Text entering={FadeInDown.duration(500)} style={hs.headline}>
          This runs on trust.
        </Reanimated.Text>
        <Reanimated.Text entering={FadeInDown.duration(500).delay(100)} style={hs.body}>
          {"We don't actually block your apps. You do \u2014 by choosing to stretch before you scroll.\n\nNo surveillance. No screen time locks. Just you keeping your word to yourself."}
        </Reanimated.Text>
      </View>
      <View style={[hs.footer, { paddingBottom: Math.max(bottom + 16, 36) }]}>
        <Reanimated.View style={btnStyle}>
          <Pressable style={hs.commitBtn} onPress={handleCommit}>
            <Ionicons name="hand-left-outline" size={20} color={Colors.white} style={{ marginRight: 10 }} />
            <Text style={hs.commitText}>I commit</Text>
          </Pressable>
        </Reanimated.View>
        <Text style={hs.sub}>{"You're building a new habit, not breaking old locks."}</Text>
      </View>
    </View>
  );
}

const hs = StyleSheet.create({
  topArea: {
    flex: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ringWrap: { alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  shieldBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: { flex: 44, paddingHorizontal: 32 },
  headline: {
    fontSize: 30,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 18,
  },
  body: {
    fontSize: 15,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  footer: { paddingHorizontal: 24, gap: 12 },
  commitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  commitText: {
    fontSize: 17,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.white,
  },
  sub: {
    fontSize: 12,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
  },
});

// ─── Step 11: App Selection ───────────────────────────────────────────────────
function AppSelectionStep({
  selected,
  setSelected,
  onNext,
}: {
  selected: string[];
  setSelected: (a: string[]) => void;
  onNext: () => void;
}) {
  const { bottom } = useSafeAreaInsets();
  const toggle = async (id: string) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    setSelected(
      selected.includes(id)
        ? selected.filter((a) => a !== id)
        : [...selected, id]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={sh.stepHeader}>
        <Reanimated.Text entering={FadeInDown.duration(400)} style={sh.stepHeadline}>
          {"Which apps\nshould require a stretch?"}
        </Reanimated.Text>
        <Reanimated.Text entering={FadeInDown.duration(400).delay(80)} style={sh.stepSub}>
          You can change these anytime.
        </Reanimated.Text>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {DISTRACTING_APPS.map((app) => {
          const on = selected.includes(app.id);
          return (
            <Pressable key={app.id} style={sh.appRow} onPress={() => toggle(app.id)}>
              <View style={[sh.appIconBox, { backgroundColor: app.color + "26" }]}>
                <Ionicons name={app.icon as any} size={22} color={app.color} />
              </View>
              <Text style={sh.appName}>{app.name}</Text>
              <View style={[sh.appCheck, on && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
                {on && <Ionicons name="checkmark" size={13} color={Colors.white} />}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={[sh.stickyFooter, { paddingBottom: Math.max(bottom + 16, 36) }]}>
        <Pressable
          style={sh.nextBtn}
          onPress={async () => {
            if (Platform.OS !== "web")
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onNext();
          }}
        >
          <Text style={sh.nextBtnText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Step 12: Reminder Timing ─────────────────────────────────────────────────
type ReminderTime = "Morning" | "Midday" | "Evening";
const REMINDER_TIMES: { id: ReminderTime; icon: string; sub: string }[] = [
  { id: "Morning", icon: "cafe-outline", sub: "Start your day with intention" },
  { id: "Midday", icon: "partly-sunny-outline", sub: "Break up the afternoon slump" },
  { id: "Evening", icon: "moon-outline", sub: "Wind down before bed" },
];

function ReminderTimingStep({
  selected,
  setSelected,
  onNext,
}: {
  selected: ReminderTime[];
  setSelected: (r: ReminderTime[]) => void;
  onNext: () => void;
}) {
  const toggle = async (id: ReminderTime) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    setSelected(
      selected.includes(id)
        ? selected.filter((r) => r !== id)
        : [...selected, id]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={sh.stepHeader}>
        <Reanimated.Text entering={FadeInDown.duration(400)} style={sh.stepHeadline}>
          {"When should\nwe nudge you?"}
        </Reanimated.Text>
        <Reanimated.Text entering={FadeInDown.duration(400).delay(80)} style={sh.stepSub}>
          Pick the times you want a gentle stretch reminder.
        </Reanimated.Text>
      </View>
      <View style={{ paddingHorizontal: 24, gap: 12 }}>
        {REMINDER_TIMES.map((r, i) => {
          const on = selected.includes(r.id);
          return (
            <Reanimated.View key={r.id} entering={FadeInDown.duration(350).delay(i * 80)}>
              <Pressable
                style={[bt.row, on && bt.rowOn]}
                onPress={() => toggle(r.id)}
              >
                <View style={[bt.iconBox, { backgroundColor: on ? "rgba(255,255,255,0.2)" : Colors.primaryMuted }]}>
                  <Ionicons name={r.icon as any} size={22} color={on ? Colors.white : Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[bt.label, on && { color: Colors.white }]}>{r.id}</Text>
                  <Text style={[bt.sub, on && { color: "rgba(255,255,255,0.7)" }]}>{r.sub}</Text>
                </View>
                <View style={[bt.check, on && { backgroundColor: "rgba(255,255,255,0.3)", borderColor: "transparent" }]}>
                  {on && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                </View>
              </Pressable>
            </Reanimated.View>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      <NextButton onPress={onNext} label={selected.length === 0 ? "Skip" : "Next"} />
    </View>
  );
}

// ─── Step 13: Permissions ─────────────────────────────────────────────────────
function PermissionsStep({
  notifOn,
  setNotifOn,
  onNext,
}: {
  notifOn: boolean;
  setNotifOn: (v: boolean) => void;
  onNext: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { bottom } = useSafeAreaInsets();

  const requestFamilyControlsAuth = async (): Promise<boolean> => {
    await new Promise((res) => setTimeout(res, 1000));
    return true;
  };

  const handleGrant = async () => {
    if (Platform.OS !== "web")
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError("");
    try {
      if (notifOn && Platform.OS !== "web") {
        await Notifications.requestPermissionsAsync();
      }
      const ok = await requestFamilyControlsAuth();
      if (ok) {
        onNext();
      } else {
        setError("Authorization failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. You can skip for now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={sh.stepHeader}>
        <Reanimated.Text entering={FadeInDown.duration(400)} style={sh.stepHeadline}>
          One important thing
        </Reanimated.Text>
      </View>
      <View style={{ paddingHorizontal: 24, gap: 14 }}>
        <Reanimated.View entering={FadeInDown.duration(400).delay(80)} style={sh.permRow}>
          <View style={[sh.permIcon, { backgroundColor: Colors.primaryMuted }]}>
            <Ionicons name="phone-portrait-outline" size={30} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={sh.permTitleRow}>
              <Text style={sh.permTitle}>Screen Time</Text>
              <View style={sh.reqBadge}>
                <Text style={sh.reqBadgeText}>Required</Text>
              </View>
            </View>
            <Text style={sh.permDesc}>
              Lets StretchGate detect when you open gated apps. Honor-system mode works without it.
            </Text>
          </View>
        </Reanimated.View>

        <Reanimated.View entering={FadeInDown.duration(400).delay(160)} style={sh.permRow}>
          <View style={[sh.permIcon, { backgroundColor: Colors.accentMuted }]}>
            <Ionicons name="notifications-outline" size={30} color={Colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={sh.permTitleRow}>
              <Text style={sh.permTitle}>Notifications</Text>
            </View>
            <Text style={sh.permDesc}>
              Stretch reminders at the times you chose. Optional but recommended.
            </Text>
          </View>
          <Switch
            value={notifOn}
            onValueChange={setNotifOn}
            trackColor={{ true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </Reanimated.View>
      </View>

      {!!error && <Text style={sh.permError}>{error}</Text>}

      <View style={{ flex: 1 }} />
      <View style={[sh.nextWrap, { paddingBottom: Math.max(bottom + 16, 36) }]}>
        <Pressable
          style={[sh.nextBtn, loading && { opacity: 0.7 }]}
          onPress={handleGrant}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={sh.nextBtnText}>Grant Screen Time Access</Text>
          )}
        </Pressable>
        <Pressable style={sh.skipLink} onPress={onNext}>
          <Text style={sh.skipLinkText}>{"Skip for now \u2014 I'll use honor-system mode"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Step 14: Customizing Plan ────────────────────────────────────────────────
const PLAN_STEPS = [
  "Building your stretch library...",
  "Personalizing timing...",
  "Configuring your gates...",
  "Syncing your preferences...",
  "Almost ready...",
];

function CustomizingPlanStep({ onNext }: { onNext: () => void }) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const phaseAnim = useRef(new Animated.Value(1)).current;
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    // Fill bar over 3.2 seconds (JS-driven so we can animate width)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3200,
      useNativeDriver: false,
    }).start();

    // Cycle phase text with a cross-fade
    const timers: ReturnType<typeof setTimeout>[] = [];
    PLAN_STEPS.forEach((_, i) => {
      if (i === 0) return;
      timers.push(
        setTimeout(() => {
          Animated.sequence([
            Animated.timing(phaseAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(phaseAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
          ]).start();
          setTimeout(() => setPhaseIdx(i), 180);
        }, i * 680)
      );
    });

    // Auto-advance after bar completes
    const done = setTimeout(onNext, 3600);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, []);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, trackWidth],
  });

  return (
    <View style={cz.container}>
      <View style={cz.top}>
        <Reanimated.View entering={FadeInDown.duration(500)} style={cz.iconBox}>
          <Ionicons name="sparkles-outline" size={48} color={Colors.primary} />
        </Reanimated.View>
        <Reanimated.Text entering={FadeInDown.duration(500).delay(80)} style={cz.title}>
          {"Customizing\nyour plan"}
        </Reanimated.Text>
      </View>

      <View style={cz.barSection}>
        <View
          style={cz.barTrack}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View style={[cz.barFill, { width: barWidth }]} />
        </View>
        <Animated.Text style={[cz.phase, { opacity: phaseAnim }]}>
          {PLAN_STEPS[phaseIdx]}
        </Animated.Text>
      </View>
    </View>
  );
}

const cz = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  top: { alignItems: "center", marginBottom: 56 },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 38,
  },
  barSection: { width: "100%", alignItems: "center", gap: 16 },
  barTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.divider,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  phase: {
    fontSize: 13,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
  },
});

// ─── Step 15: Completion ──────────────────────────────────────────────────────
function CompletionStep({
  selectedAreas,
  selectedApps,
  selectedDuration,
  onFinish,
}: {
  selectedAreas: BodyArea[];
  selectedApps: string[];
  selectedDuration: number;
  onFinish: () => void;
}) {
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const { bottom } = useSafeAreaInsets();

  useEffect(() => {
    checkScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));
    checkOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    textOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    statsOpacity.value = withDelay(1100, withTiming(1, { duration: 500 }));
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const statsStyle = useAnimatedStyle(() => ({ opacity: statsOpacity.value }));

  return (
    <View style={cp.container}>
      <View style={cp.top}>
        <Reanimated.View style={[cp.checkBox, checkStyle]}>
          <Ionicons name="checkmark" size={52} color={Colors.white} />
        </Reanimated.View>
        <Reanimated.Text style={[cp.heading, textStyle]}>{"You're ready."}</Reanimated.Text>
        <Reanimated.Text style={[cp.sub, textStyle]}>
          Every stretch is a small win.
        </Reanimated.Text>
      </View>
      <Reanimated.View style={[cp.statsBox, statsStyle]}>
        <View style={cp.statRow}>
          <Ionicons name="body-outline" size={18} color="rgba(255,255,255,0.7)" />
          <Text style={cp.statText}>
            {selectedAreas.length > 0
              ? `${selectedAreas.length} body area${selectedAreas.length > 1 ? "s" : ""} to focus on`
              : "Full-body stretches queued"}
          </Text>
        </View>
        <View style={cp.statRow}>
          <Ionicons name="phone-portrait-outline" size={18} color="rgba(255,255,255,0.7)" />
          <Text style={cp.statText}>
            {selectedApps.length > 0
              ? `${selectedApps.length} app${selectedApps.length > 1 ? "s" : ""} gated`
              : "Honor-system mode active"}
          </Text>
        </View>
        <View style={cp.statRow}>
          <Ionicons name="timer-outline" size={18} color="rgba(255,255,255,0.7)" />
          <Text style={cp.statText}>{selectedDuration}s per stretch session</Text>
        </View>
      </Reanimated.View>
      <View style={[cp.footer, { paddingBottom: Math.max(bottom + 16, 36) }]}>
        <Pressable style={cp.btn} onPress={onFinish}>
          <Text style={cp.btnText}>Start Moving</Text>
        </Pressable>
      </View>
    </View>
  );
}

const cp = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  top: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  checkBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  heading: {
    fontSize: 38,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.white,
    textAlign: "center",
  },
  sub: {
    fontSize: 16,
    fontFamily: "DM_Sans_400Regular",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  statsBox: {
    marginHorizontal: 24,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statText: {
    fontSize: 14,
    fontFamily: "DM_Sans_500Medium",
    color: "rgba(255,255,255,0.9)",
  },
  footer: { paddingHorizontal: 24, paddingTop: 20 },
  btn: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
  },
  btnText: {
    fontSize: 17,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.primary,
  },
});

// ─── Root Onboarding Component ────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { updateSettings } = useApp();
  const [step, setStep] = useState(0);
  const [canTapSplash, setCanTapSplash] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Per-step state
  const [selectedAreas, setSelectedAreas] = useState<BodyArea[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<DurOpt>(45);
  const [dailyGoal, setDailyGoal] = useState(3);
  const [selectedScrollTimes, setSelectedScrollTimes] = useState<ScrollTime[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedReminderTimes, setSelectedReminderTimes] = useState<ReminderTime[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(true);

  const goNext = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  // Splash auto-advance
  useEffect(() => {
    if (step !== 0) return;
    const tapT = setTimeout(() => setCanTapSplash(true), 2000);
    const autoT = setTimeout(goNext, 5000);
    return () => { clearTimeout(tapT); clearTimeout(autoT); };
  }, [step, goNext]);

  const handleFinish = useCallback(async () => {
    // Map capitalized local types to lowercase service types
    const mappedReminderTimes = selectedReminderTimes.map(
      t => t.toLowerCase() as ServiceReminderTime
    );
    const mappedScrollTimes = selectedScrollTimes.map(
      t => t.toLowerCase() as 'morning' | 'midday' | 'evening' | 'night'
    );

    let permissionStatus: 'undetermined' | 'granted' | 'denied' = 'undetermined';

    // If user enabled reminders, request permission now
    if (notifEnabled && mappedReminderTimes.length > 0) {
      permissionStatus = await requestReminderPermissions();
    }

    await updateSettings({
      focusBodyAreas: selectedAreas,
      preferredDuration: selectedDuration,
      dailyGoal,
      lockedApps: selectedApps,
      reminderEnabled: notifEnabled,
      selectedScrollTimes: mappedScrollTimes,
      selectedReminderTimes: mappedReminderTimes,
      notificationPermissionStatus: permissionStatus,
      honorSystemMode: true,
      hasCompletedOnboarding: true,
    });

    // Sync notifications with final state
    await syncStretchReminderNotifications({
      reminderEnabled: notifEnabled,
      selectedReminderTimes: mappedReminderTimes,
      focusBodyAreas: selectedAreas,
      notificationPermissionStatus: permissionStatus,
    });

    router.replace("/(tabs)/");
  }, [
    updateSettings, selectedAreas, selectedDuration, dailyGoal,
    selectedApps, notifEnabled, selectedReminderTimes, selectedScrollTimes,
  ]);

  const renderStep = () => {
    switch (step) {
      case 0:  return <SplashStep onAdvance={goNext} canTap={canTapSplash} />;
      case 1:  return <ProblemStep onNext={goNext} />;
      case 2:  return <ShiftStep onNext={goNext} />;
      case 3:  return <PromiseStep onNext={goNext} />;
      case 4:  return <HowItWorksStep onNext={goNext} />;
      case 5:  return <WhatYouGainStep onNext={goNext} />;
      case 6:  return <FocusAreasStep selected={selectedAreas} setSelected={setSelectedAreas} onNext={goNext} />;
      case 7:  return <DurationStep selected={selectedDuration} setSelected={setSelectedDuration} onNext={goNext} />;
      case 8:  return <DailyGoalStep goal={dailyGoal} setGoal={setDailyGoal} onNext={goNext} />;
      case 9:  return <BestTimeStep selected={selectedScrollTimes} setSelected={setSelectedScrollTimes} onNext={goNext} />;
      case 10: return <HonorSystemStep onNext={goNext} />;
      case 11: return <AppSelectionStep selected={selectedApps} setSelected={setSelectedApps} onNext={goNext} />;
      case 12: return <ReminderTimingStep selected={selectedReminderTimes} setSelected={setSelectedReminderTimes} onNext={goNext} />;
      case 13: return <PermissionsStep notifOn={notifEnabled} setNotifOn={setNotifEnabled} onNext={goNext} />;
      case 14: return <CustomizingPlanStep onNext={goNext} />;
      case 15: return <CompletionStep selectedAreas={selectedAreas} selectedApps={selectedApps} selectedDuration={selectedDuration} onFinish={handleFinish} />;
      default: return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden />
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {renderStep()}
      </Animated.View>
    </View>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const sh = StyleSheet.create({
  nextWrap: { paddingHorizontal: 24 },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  nextBtnText: {
    fontSize: 17,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.white,
  },
  stepHeader: {
    paddingHorizontal: 32,
    paddingTop: 76,
    paddingBottom: 36,
    alignItems: "center",
  },
  stepHeadline: {
    fontSize: 28,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 10,
  },
  stepSub: {
    fontSize: 14,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
  },
  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  areaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 100,
    borderWidth: 1,
    minWidth: "45%",
    justifyContent: "center",
  },
  areaChipText: { fontSize: 15, fontFamily: "DM_Sans_600SemiBold" },
  durationList: { paddingHorizontal: 24, gap: 12 },
  durCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    borderRadius: 20,
    padding: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.divider,
    minHeight: 88,
  },
  durCardOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  durNum: {
    fontSize: 32,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    lineHeight: 36,
  },
  durUnit: {
    fontSize: 14,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
  },
  durLabel: {
    fontSize: 16,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.text,
    marginBottom: 5,
  },
  durBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.accentMuted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durBadgeText: {
    fontSize: 11,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.accent,
  },
  goalPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 44,
    paddingTop: 16,
  },
  goalCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  goalNum: {
    fontSize: 72,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    lineHeight: 82,
  },
  goalLabel: {
    fontSize: 16,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    height: 64,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  appIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.text,
  },
  appCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyFooter: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  permRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
  },
  permIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  permTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  permTitle: {
    fontSize: 16,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
  },
  permDesc: {
    fontSize: 13,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
    lineHeight: 19,
  },
  reqBadge: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  reqBadgeText: {
    fontSize: 10,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.primary,
  },
  permError: {
    fontSize: 13,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.error,
    textAlign: "center",
    marginTop: 8,
  },
  skipLink: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 4,
  },
  skipLinkText: {
    fontSize: 13,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
  },
});
