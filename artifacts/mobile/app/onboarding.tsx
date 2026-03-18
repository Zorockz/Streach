import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { STRETCH_CATEGORIES, DISTRACTING_APPS, BodyArea } from "@/constants/stretches";
import { useApp } from "@/context/AppContext";

const { width: W } = Dimensions.get("window");

type StepId =
  | "welcome"
  | "why"
  | "how"
  | "commitment"
  | "apps"
  | "areas"
  | "goal"
  | "duration"
  | "scrolltime"
  | "notifications"
  | "ready";

const ALL_STEPS: StepId[] = [
  "welcome", "why", "how", "commitment",
  "apps", "areas", "goal", "duration",
  "scrolltime", "notifications", "ready",
];

// ─── Shared UI ────────────────────────────────────────
function PrimaryBtn({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handlePress = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(withTiming(0.96, { duration: 80 }), withSpring(1));
    onPress();
  };
  return (
    <Animated.View style={animStyle}>
      <Pressable style={styles.primaryBtn} onPress={handlePress}>
        <Text style={styles.primaryBtnText}>{loading ? "Setting up…" : label}</Text>
        {!loading && <Ionicons name="arrow-forward" size={18} color={Colors.white} />}
      </Pressable>
    </Animated.View>
  );
}

function SkipBtn({ label = "Skip for now", onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable style={styles.skipBtn} onPress={onPress}>
      <Text style={styles.skipBtnText}>{label}</Text>
    </Pressable>
  );
}

// Floating icon with gentle bob animation
function FloatingIcon({ name, color, bgColor }: { name: string; color: string; bgColor: string }) {
  const ty = useSharedValue(0);
  React.useEffect(() => {
    ty.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1800 }),
        withTiming(0, { duration: 1800 })
      ),
      -1, true
    );
  }, []);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  return (
    <Animated.View entering={FadeIn.duration(600)} style={[styles.emojiBox, { backgroundColor: bgColor }, anim]}>
      <Ionicons name={name as any} size={58} color={color} />
    </Animated.View>
  );
}

// ─── Step 1: Welcome ─────────────────────────────────
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.step}>
      <FloatingIcon name="leaf-outline" color={Colors.primary} bgColor={Colors.primaryMuted} />
      <Animated.Text entering={FadeInDown.duration(500).delay(200)} style={styles.h1}>
        Welcome to{"\n"}StretchGate
      </Animated.Text>
      <Animated.Text entering={FadeInDown.duration(500).delay(350)} style={styles.body}>
        The wellness app that turns phone habits into movement moments.
        You scroll less mindlessly. You move more intentionally.
      </Animated.Text>
      <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.stepFooter}>
        <PrimaryBtn label="Let's begin" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

// ─── Step 2: Why ─────────────────────────────────────
function StepWhy({ onNext }: { onNext: () => void }) {
  const stats = [
    { num: "11h", label: "Average daily screen time for adults", delay: 150 },
    { num: "3 min", label: "Sufficient movement to reset your nervous system", delay: 250 },
    { num: "21", label: "Days to build a lasting new habit", delay: 350 },
  ];
  return (
    <View style={styles.step}>
      <Animated.Text entering={FadeInDown.duration(500)} style={styles.h1}>Why this{"\n"}matters</Animated.Text>
      <View style={styles.statCards}>
        {stats.map((s, i) => (
          <Animated.View key={i} entering={FadeInDown.duration(450).delay(s.delay)} style={styles.statCard}>
            <Text style={styles.statNum}>{s.num}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </Animated.View>
        ))}
      </View>
      <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.stepFooter}>
        <PrimaryBtn label="I'm in" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

// ─── Step 3: How it works ─────────────────────────────
function StepHow({ onNext }: { onNext: () => void }) {
  const steps = [
    { icon: "lock-closed-outline", color: Colors.accent, title: "Open an app", sub: "Instagram, TikTok, YouTube — the usual suspects" },
    { icon: "body-outline", color: Colors.primary, title: "Do one stretch", sub: "20–60 seconds, guided and simple" },
    { icon: "phone-portrait-outline", color: "#5856D6", title: "Then scroll freely", sub: "You earned it. Body happy, brain reset." },
  ];
  return (
    <View style={styles.step}>
      <Animated.Text entering={FadeInDown.duration(500)} style={styles.h1}>Here's{"\n"}the deal</Animated.Text>
      <Animated.Text entering={FadeInDown.duration(500).delay(120)} style={styles.body}>
        StretchGate runs on trust and the good feeling you get after moving.
      </Animated.Text>
      <View style={styles.flowList}>
        {steps.map((s, i) => (
          <Animated.View key={i} entering={FadeInDown.duration(420).delay(i * 120 + 200)}>
            <View style={styles.flowCard}>
              <View style={[styles.flowIcon, { backgroundColor: s.color + "18" }]}>
                <Ionicons name={s.icon as any} size={22} color={s.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.flowTitle}>{s.title}</Text>
                <Text style={styles.flowSub}>{s.sub}</Text>
              </View>
            </View>
            {i < 2 && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(i * 120 + 380)}
                style={styles.flowConnector}
              >
                <View style={styles.flowConnectorLine} />
                <Ionicons name="chevron-down" size={13} color={Colors.textMuted} />
              </Animated.View>
            )}
          </Animated.View>
        ))}
      </View>
      <Animated.View entering={FadeInDown.duration(500).delay(700)} style={styles.stepFooter}>
        <PrimaryBtn label="Makes sense" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

// ─── Step 4: Commitment ───────────────────────────────
function StepCommitment({ onNext }: { onNext: () => void }) {
  const intentions = [
    "Reduce mindless scrolling",
    "Move more throughout the day",
    "Build a daily stretch habit",
    "Relieve phone-related tension",
    "Feel better in my body",
  ];
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (i: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setPicked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  };

  return (
    <View style={styles.step}>
      <FloatingIcon name="heart-outline" color={Colors.accent} bgColor={Colors.accentMuted} />
      <Animated.Text entering={FadeInDown.duration(500).delay(100)} style={styles.h1}>Why are you{"\n"}doing this?</Animated.Text>
      <Animated.Text entering={FadeInDown.duration(500).delay(220)} style={styles.body}>
        Pick what resonates. We'll remind you when motivation dips.
      </Animated.Text>
      <Animated.View entering={FadeInDown.duration(500).delay(340)} style={styles.intentGrid}>
        {intentions.map((intent, i) => {
          const on = picked.includes(intent);
          return (
            <Animated.View
              key={intent}
              entering={FadeInDown.duration(350).delay(i * 50 + 300)}
            >
              <Pressable
                style={[styles.intentChip, on && styles.intentChipOn]}
                onPress={() => toggle(intent)}
              >
                {on && <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />}
                <Text style={[styles.intentChipText, on && styles.intentChipTextOn]}>{intent}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.stepFooter}>
        <PrimaryBtn label={picked.length ? "That's my why" : "Skip this"} onPress={onNext} />
      </Animated.View>
    </View>
  );
}

// ─── Step 5: Apps ─────────────────────────────────────
function StepApps({ onNext }: { onNext: (apps: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>(["tiktok", "instagram", "youtube"]);
  const toggle = (id: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelected(s => s.includes(id) ? s.filter(a => a !== id) : [...s, id]);
  };
  return (
    <View style={styles.step}>
      <Animated.Text entering={FadeInDown.duration(500)} style={styles.h1}>Which apps{"\n"}distract you most?</Animated.Text>
      <Animated.Text entering={FadeInDown.duration(500).delay(120)} style={styles.body}>
        You'll stretch before opening these. Change anytime in Settings.
      </Animated.Text>
      <Animated.View entering={FadeInDown.duration(500).delay(240)} style={styles.appGrid}>
        {DISTRACTING_APPS.map((app, i) => {
          const on = selected.includes(app.id);
          return (
            <Animated.View key={app.id} entering={FadeInDown.duration(300).delay(i * 30 + 220)}>
              <Pressable style={[styles.appChip, on && styles.appChipOn]} onPress={() => toggle(app.id)}>
                <Ionicons name={app.icon as any} size={15} color={on ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.appChipText, on && { color: Colors.white }]}>{app.name}</Text>
                {on && <Ionicons name="checkmark" size={11} color={Colors.white} />}
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.stepFooter}>
        <PrimaryBtn
          label={selected.length ? `Gate ${selected.length} app${selected.length > 1 ? "s" : ""}` : "Skip for now"}
          onPress={() => onNext(selected)}
        />
      </Animated.View>
    </View>
  );
}

// ─── Step 6: Areas ────────────────────────────────────
function StepAreas({ onNext }: { onNext: (areas: BodyArea[]) => void }) {
  const [selected, setSelected] = useState<BodyArea[]>([]);
  const toggle = (id: BodyArea) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelected(s => s.includes(id) ? s.filter(a => a !== id) : [...s, id]);
  };
  return (
    <View style={styles.step}>
      <Animated.Text entering={FadeInDown.duration(500)} style={styles.h1}>Where do you{"\n"}hold tension?</Animated.Text>
      <Animated.Text entering={FadeInDown.duration(500).delay(120)} style={styles.body}>
        We'll personalize your stretches. Leave empty for a balanced mix.
      </Animated.Text>
      <Animated.View entering={FadeInDown.duration(500).delay(240)} style={styles.areaGrid}>
        {STRETCH_CATEGORIES.map((cat, i) => {
          const on = selected.includes(cat.id);
          return (
            <Animated.View key={cat.id} entering={FadeInDown.duration(350).delay(i * 60 + 200)}>
              <Pressable
                style={[styles.areaCard, on && { backgroundColor: cat.color, borderColor: cat.color }]}
                onPress={() => toggle(cat.id)}
              >
                <Ionicons name={cat.icon as any} size={26} color={on ? "#fff" : cat.color} />
                <Text style={[styles.areaName, on && { color: "#fff" }]}>{cat.label.split(" ")[0]}</Text>
                <Text style={[styles.areaSub, on && { color: "rgba(255,255,255,0.7)" }]}>
                  {cat.description}
                </Text>
                {on && (
                  <View style={styles.areaCheck}>
                    <Ionicons name="checkmark" size={11} color={Colors.white} />
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.stepFooter}>
        <PrimaryBtn
          label={selected.length ? `Focus on ${selected.length} area${selected.length > 1 ? "s" : ""}` : "Give me variety"}
          onPress={() => onNext(selected)}
        />
      </Animated.View>
    </View>
  );
}

// ─── Step 7: Daily goal ───────────────────────────────
function StepGoal({ onNext }: { onNext: (goal: number) => void }) {
  const [goal, setGoal] = useState(3);
  const options = [
    { val: 1, label: "1 stretch", sub: "Just getting started" },
    { val: 2, label: "2 stretches", sub: "Building momentum" },
    { val: 3, label: "3 stretches", sub: "Recommended", rec: true },
    { val: 5, label: "5 stretches", sub: "Committed mover" },
    { val: 7, label: "7+ stretches", sub: "Seriously dedicated" },
  ];
  return (
    <View style={styles.step}>
      <FloatingIcon name="trophy-outline" color={Colors.accent} bgColor={Colors.accentMuted} />
      <Animated.Text entering={FadeInDown.duration(500).delay(100)} style={styles.h1}>Set your{"\n"}daily goal</Animated.Text>
      <Animated.View entering={FadeInDown.duration(500).delay(220)} style={{ gap: 8, marginBottom: 20 }}>
        {options.map((o, i) => (
          <Animated.View key={o.val} entering={FadeInDown.duration(350).delay(i * 50 + 200)}>
            <Pressable
              style={[styles.optionRow, goal === o.val && styles.optionRowOn]}
              onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setGoal(o.val); }}
            >
              <View style={[styles.optionRadio, goal === o.val && styles.optionRadioOn]}>
                {goal === o.val && <View style={styles.optionRadioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, goal === o.val && { color: Colors.primary }]}>{o.label}</Text>
                <Text style={styles.optionSub}>{o.sub}</Text>
              </View>
              {o.rec && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(500).delay(550)} style={styles.stepFooter}>
        <PrimaryBtn label={`Set ${goal} per day`} onPress={() => onNext(goal)} />
      </Animated.View>
    </View>
  );
}

// ─── Step 8: Duration ─────────────────────────────────
function StepDuration({ onNext }: { onNext: (dur: number) => void }) {
  const [dur, setDur] = useState(30);
  const opts = [
    { val: 20, label: "Quick", sub: "20 seconds · I'm always rushed", icon: "flash-outline" },
    { val: 30, label: "Balanced", sub: "30 seconds · Just right", icon: "checkmark-circle-outline" },
    { val: 45, label: "Deep", sub: "45 seconds · I want to really feel it", icon: "leaf-outline" },
    { val: 60, label: "Thorough", sub: "60 seconds · Give me the full stretch", icon: "time-outline" },
  ];
  return (
    <View style={styles.step}>
      <Animated.Text entering={FadeInDown.duration(500)} style={styles.h1}>How long do{"\n"}you like to stretch?</Animated.Text>
      <Animated.Text entering={FadeInDown.duration(500).delay(120)} style={styles.body}>
        This personalizes your stretch library. Adjust anytime.
      </Animated.Text>
      <Animated.View entering={FadeInDown.duration(500).delay(240)} style={{ gap: 8, marginBottom: 20 }}>
        {opts.map((o, i) => (
          <Animated.View key={o.val} entering={FadeInDown.duration(350).delay(i * 60 + 220)}>
            <Pressable
              style={[styles.durationCard, dur === o.val && styles.durationCardOn]}
              onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setDur(o.val); }}
            >
              <View style={[styles.durationIcon, { backgroundColor: dur === o.val ? Colors.primaryMuted : Colors.bgSurface }]}>
                <Ionicons name={o.icon as any} size={20} color={dur === o.val ? Colors.primary : Colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.durationLabel, dur === o.val && { color: Colors.primary }]}>{o.label}</Text>
                <Text style={styles.durationSub}>{o.sub}</Text>
              </View>
              {dur === o.val && (
                <Animated.View entering={FadeIn.duration(200)}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(500).delay(580)} style={styles.stepFooter}>
        <PrimaryBtn label="That works for me" onPress={() => onNext(dur)} />
      </Animated.View>
    </View>
  );
}

// ─── Step 9: When you scroll ──────────────────────────
function StepScrollTime({ onNext }: { onNext: () => void }) {
  const [time, setTime] = useState<string | null>(null);
  const opts = [
    { val: "morning", label: "Morning", sub: "First thing when I wake up", icon: "sunny-outline" },
    { val: "day", label: "During the day", sub: "Breaks and lunch hours", icon: "briefcase-outline" },
    { val: "evening", label: "Evening", sub: "After work winds down", icon: "moon-outline" },
    { val: "always", label: "All the time", sub: "Honestly, constantly", icon: "infinite-outline" },
  ];
  return (
    <View style={styles.step}>
      <Animated.Text entering={FadeInDown.duration(500)} style={styles.h1}>When do you{"\n"}scroll most?</Animated.Text>
      <Animated.Text entering={FadeInDown.duration(500).delay(120)} style={styles.body}>
        We'll use this to personalize your stretch recommendations.
      </Animated.Text>
      <Animated.View entering={FadeInDown.duration(500).delay(240)} style={{ gap: 8, marginBottom: 20 }}>
        {opts.map((o, i) => (
          <Animated.View key={o.val} entering={FadeInDown.duration(350).delay(i * 60 + 220)}>
            <Pressable
              style={[styles.durationCard, time === o.val && styles.durationCardOn]}
              onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setTime(o.val); }}
            >
              <View style={[styles.durationIcon, { backgroundColor: time === o.val ? Colors.primaryMuted : Colors.bgSurface }]}>
                <Ionicons name={o.icon as any} size={20} color={time === o.val ? Colors.primary : Colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.durationLabel, time === o.val && { color: Colors.primary }]}>{o.label}</Text>
                <Text style={styles.durationSub}>{o.sub}</Text>
              </View>
              {time === o.val && (
                <Animated.View entering={FadeIn.duration(200)}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(500).delay(540)} style={styles.stepFooter}>
        <PrimaryBtn label={time ? "That's me" : "Skip this"} onPress={onNext} />
      </Animated.View>
    </View>
  );
}

// ─── Step 10: Notifications ───────────────────────────
function StepNotifications({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    try {
      if (Platform.OS !== "web") {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === "granted") {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Time to move",
              body: "One quick stretch before you scroll",
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: 9,
              minute: 0,
              repeats: true,
            },
          });
        }
      }
    } catch (e) {
      console.warn("Notification error", e);
    }
    setLoading(false);
    onNext();
  };

  const perms = [
    { icon: "alarm-outline", text: "Daily reminder at 9 AM" },
    { icon: "shield-checkmark-outline", text: "Turn off anytime in Settings" },
    { icon: "ban-outline", text: "No marketing, no tracking" },
  ];

  return (
    <View style={styles.step}>
      <FloatingIcon name="notifications-outline" color={Colors.primary} bgColor={Colors.primaryMuted} />
      <Animated.Text entering={FadeInDown.duration(500).delay(150)} style={styles.h1}>Stay on track{"\n"}with reminders</Animated.Text>
      <Animated.Text entering={FadeInDown.duration(500).delay(280)} style={styles.body}>
        One gentle morning nudge to start your day with movement.
      </Animated.Text>
      <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.permCard}>
        {perms.map((p, i) => (
          <Animated.View key={p.text} entering={FadeInDown.duration(350).delay(i * 80 + 380)} style={styles.permRow}>
            <Ionicons name={p.icon as any} size={16} color={Colors.primary} />
            <Text style={styles.permText}>{p.text}</Text>
          </Animated.View>
        ))}
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(500).delay(660)} style={styles.stepFooter}>
        <PrimaryBtn label="Allow reminders" onPress={handleAllow} loading={loading} />
        <SkipBtn label="No thanks" onPress={onSkip} />
      </Animated.View>
    </View>
  );
}

// ─── Step 11: Ready ───────────────────────────────────
function StepReady({ onDone }: { onDone: () => void }) {
  const summary = [
    "Complete a stretch before your gated apps",
    "Build a streak by hitting your daily goal",
    "Track progress in the Progress tab",
    "Adjust everything in Settings anytime",
  ];
  return (
    <View style={styles.step}>
      <Animated.View entering={FadeIn.duration(700)} style={[styles.emojiBox, { backgroundColor: Colors.primaryMuted }]}>
        <Ionicons name="checkmark-circle" size={60} color={Colors.primary} />
      </Animated.View>
      <Animated.Text entering={FadeInDown.duration(500).delay(200)} style={styles.h1}>
        You're all{"\n"}set!
      </Animated.Text>
      <Animated.View entering={FadeInDown.duration(500).delay(350)} style={styles.readyList}>
        {summary.map((s, i) => (
          <Animated.View key={i} entering={FadeInDown.duration(350).delay(i * 80 + 320)} style={styles.readyRow}>
            <View style={styles.readyDot}>
              <Ionicons name="checkmark" size={12} color={Colors.primary} />
            </View>
            <Text style={styles.readyText}>{s}</Text>
          </Animated.View>
        ))}
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(500).delay(680)} style={styles.stepFooter}>
        <Pressable style={styles.launchBtn} onPress={onDone}>
          <Ionicons name="body-outline" size={20} color={Colors.white} />
          <Text style={styles.launchBtnText}>Start StretchGate</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────
export default function OnboardingScreen() {
  const { updateSettings } = useApp();
  const [stepIdx, setStepIdx] = useState(0);
  const directionRef = useRef<"forward" | "back">("forward");
  const step = ALL_STEPS[stepIdx];
  const progress = (stepIdx + 1) / ALL_STEPS.length;

  const go = async (increment = 1) => {
    if (increment > 0) {
      directionRef.current = "forward";
      if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      directionRef.current = "back";
    }
    setStepIdx(i => Math.max(0, Math.min(ALL_STEPS.length - 1, i + increment)));
  };

  const next = () => go(1);
  const back = () => go(-1);

  const finish = async () => {
    await updateSettings({ hasCompletedOnboarding: true });
    router.replace("/(tabs)");
  };

  const entering = directionRef.current === "forward"
    ? SlideInRight.duration(350)
    : SlideInLeft.duration(350);
  const exiting = directionRef.current === "forward"
    ? SlideOutLeft.duration(280)
    : SlideOutRight.duration(280);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Top bar */}
      <View style={styles.topBar}>
        {stepIdx > 0 ? (
          <Pressable style={styles.backBtn} onPress={back}>
            <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <Text style={styles.stepCounter}>{stepIdx + 1} / {ALL_STEPS.length}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Step content with slide transition */}
      <Animated.View
        key={stepIdx}
        entering={entering}
        exiting={exiting}
        style={styles.stepWrapper}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          bounces={false}
        >
          {step === "welcome" && <StepWelcome onNext={next} />}
          {step === "why" && <StepWhy onNext={next} />}
          {step === "how" && <StepHow onNext={next} />}
          {step === "commitment" && <StepCommitment onNext={next} />}
          {step === "apps" && (
            <StepApps onNext={async apps => {
              await updateSettings({ lockedApps: apps });
              next();
            }} />
          )}
          {step === "areas" && (
            <StepAreas onNext={async areas => {
              await updateSettings({ focusBodyAreas: areas });
              next();
            }} />
          )}
          {step === "goal" && (
            <StepGoal onNext={async goal => {
              await updateSettings({ dailyGoal: goal });
              next();
            }} />
          )}
          {step === "duration" && (
            <StepDuration onNext={async dur => {
              await updateSettings({ preferredDuration: dur });
              next();
            }} />
          )}
          {step === "scrolltime" && <StepScrollTime onNext={next} />}
          {step === "notifications" && (
            <StepNotifications onNext={next} onSkip={next} />
          )}
          {step === "ready" && <StepReady onDone={finish} />}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  progressTrack: { height: 3, backgroundColor: Colors.bgSurface },
  progressFill: { height: "100%", backgroundColor: Colors.primary },
  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgCard, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.divider,
  },
  stepCounter: { fontSize: 13, fontFamily: "DM_Sans_500Medium", color: Colors.textMuted },
  stepWrapper: { flex: 1, overflow: "hidden" },
  scroll: { flexGrow: 1 },
  step: {
    flex: 1, paddingHorizontal: 26, paddingTop: 22,
    paddingBottom: 12, minHeight: 460,
  },
  emojiBox: {
    alignSelf: "center", width: 110, height: 110, borderRadius: 30,
    backgroundColor: Colors.bgCard, alignItems: "center",
    justifyContent: "center", marginBottom: 26,
    borderWidth: 1, borderColor: Colors.divider,
  },
  h1: {
    fontSize: 34, fontFamily: "DM_Sans_700Bold",
    color: Colors.text, letterSpacing: -0.6,
    lineHeight: 42, marginBottom: 14,
  },
  body: {
    fontSize: 16, fontFamily: "DM_Sans_400Regular",
    color: Colors.textSecondary, lineHeight: 24, marginBottom: 22,
  },
  stepFooter: { gap: 10, marginTop: "auto", paddingTop: 16 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", backgroundColor: Colors.primary,
    borderRadius: 16, paddingVertical: 16, gap: 10,
  },
  primaryBtnText: { fontSize: 17, fontFamily: "DM_Sans_700Bold", color: Colors.white },
  skipBtn: { alignItems: "center", paddingVertical: 10 },
  skipBtnText: { fontSize: 14, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },

  // Stats
  statCards: { gap: 10, marginBottom: 24 },
  statCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: Colors.divider,
  },
  statNum: { fontSize: 36, fontFamily: "DM_Sans_700Bold", color: Colors.primary, marginBottom: 4 },
  statLabel: { fontSize: 14, fontFamily: "DM_Sans_400Regular", color: Colors.textSecondary, lineHeight: 20 },

  // Flow
  flowList: { gap: 0, marginBottom: 20 },
  flowCard: {
    backgroundColor: Colors.bgCard, borderRadius: 14,
    padding: 14, flexDirection: "row", alignItems: "center",
    gap: 14, borderWidth: 1, borderColor: Colors.divider,
  },
  flowConnector: { alignItems: "center", paddingVertical: 2 },
  flowConnectorLine: { width: 1, height: 6, backgroundColor: Colors.divider },
  flowIcon: {
    width: 46, height: 46, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  flowTitle: { fontSize: 15, fontFamily: "DM_Sans_600SemiBold", color: Colors.text, marginBottom: 3 },
  flowSub: { fontSize: 12, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },

  // Commitment
  intentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 22 },
  intentChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22,
    backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.divider,
  },
  intentChipOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  intentChipText: { fontSize: 14, fontFamily: "DM_Sans_500Medium", color: Colors.textSecondary },
  intentChipTextOn: { color: Colors.primary },

  // Apps
  appGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 22 },
  appChip: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: 22,
    backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.divider,
  },
  appChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primaryDark },
  appChipText: { fontSize: 13, fontFamily: "DM_Sans_500Medium", color: Colors.textSecondary },

  // Areas
  areaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 22 },
  areaCard: {
    width: (W - 52 - 10) / 2, backgroundColor: Colors.bgCard,
    borderRadius: 16, padding: 14, gap: 6,
    borderWidth: 1.5, borderColor: Colors.divider, position: "relative",
  },
  areaName: { fontSize: 15, fontFamily: "DM_Sans_600SemiBold", color: Colors.text },
  areaSub: { fontSize: 11, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },
  areaCheck: {
    position: "absolute", top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center",
  },

  // Goal
  optionRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: Colors.divider,
  },
  optionRowOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  optionRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.textMuted,
    alignItems: "center", justifyContent: "center",
  },
  optionRadioOn: { borderColor: Colors.primary },
  optionRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  optionLabel: { fontSize: 15, fontFamily: "DM_Sans_600SemiBold", color: Colors.text, marginBottom: 2 },
  optionSub: { fontSize: 12, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },
  recommendedBadge: {
    backgroundColor: Colors.accentMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  recommendedText: { fontSize: 11, fontFamily: "DM_Sans_600SemiBold", color: Colors.accent },

  // Duration / ScrollTime
  durationCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: Colors.divider,
  },
  durationCardOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  durationIcon: {
    width: 46, height: 46, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  durationLabel: { fontSize: 15, fontFamily: "DM_Sans_600SemiBold", color: Colors.text, marginBottom: 2 },
  durationSub: { fontSize: 12, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },

  // Notifications
  permCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16,
    padding: 18, gap: 14, marginBottom: 22,
    borderWidth: 1, borderColor: Colors.divider,
  },
  permRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  permText: { fontSize: 14, fontFamily: "DM_Sans_400Regular", color: Colors.textSecondary },

  // Ready
  readyList: { gap: 14, marginBottom: 26 },
  readyRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  readyDot: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: Colors.primaryMuted, alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginTop: 1,
  },
  readyText: {
    fontSize: 15, fontFamily: "DM_Sans_400Regular",
    color: Colors.textSecondary, lineHeight: 22, flex: 1,
  },
  launchBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", backgroundColor: Colors.primary,
    borderRadius: 16, paddingVertical: 18, gap: 10,
  },
  launchBtnText: { fontSize: 18, fontFamily: "DM_Sans_700Bold", color: Colors.white },
});
