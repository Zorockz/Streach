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

// ─── Shared Next Button ───────────────────────────────────────────────────────
function NextButton({
  label = "Next",
  onPress,
  loading = false,
}: {
  label?: string;
  onPress: () => void;
  loading?: boolean;
}) {
  const { bottom } = useSafeAreaInsets();
  const handlePress = async () => {
    if (Platform.OS !== "web")
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };
  return (
    <View
      style={[sh.nextWrap, { paddingBottom: Math.max(bottom + 16, 36) }]}
    >
      <Pressable
        style={[sh.nextBtn, loading && { opacity: 0.7 }]}
        onPress={handlePress}
        disabled={loading}
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

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    opacity: chevronOpacity.value,
    transform: [{ translateY: chevronY.value }],
  }));

  return (
    <Pressable
      style={spl.container}
      onPress={() => {
        if (canTap) onAdvance();
      }}
    >
      <Reanimated.View style={[spl.iconBox, iconStyle]}>
        <Ionicons name="leaf" size={72} color={Colors.primary} />
      </Reanimated.View>
      <Reanimated.Text style={[spl.title, titleStyle]}>
        StretchGate
      </Reanimated.Text>
      <Reanimated.Text style={[spl.tagline, taglineStyle]}>
        Earn your scroll.
      </Reanimated.Text>
      <Reanimated.View style={[spl.chevron, chevronStyle]}>
        <Ionicons name="chevron-down" size={26} color={Colors.textMuted} />
      </Reanimated.View>
      {/* Dark overlay fades away */}
      <Reanimated.View
        style={[spl.overlay, overlayStyle]}
        pointerEvents="none"
      />
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
  chevron: {
    position: "absolute",
    bottom: 60,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0D1F1A",
  },
});

// ─── Emotional Screens A / B / C ──────────────────────────────────────────────
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
      {/* Top ~45%: animated icon */}
      <View style={em.iconArea}>
        <Reanimated.View style={iconAnim}>{iconNode}</Reanimated.View>
      </View>
      {/* Text */}
      <View style={em.textArea}>
        <Reanimated.Text
          entering={FadeInDown.duration(500)}
          style={em.headline}
        >
          {headline}
        </Reanimated.Text>
        <Reanimated.Text
          entering={FadeInDown.duration(500).delay(120)}
          style={em.body}
        >
          {body}
        </Reanimated.Text>
      </View>
      <NextButton onPress={onNext} />
    </View>
  );
}

const em = StyleSheet.create({
  iconArea: {
    flex: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: {
    flex: 42,
    paddingHorizontal: 32,
  },
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

// Step 1 — The Problem
function ProblemStep({ onNext }: { onNext: () => void }) {
  const tilt = useSharedValue(0);
  useEffect(() => {
    tilt.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1200 }),
        withTiming(8, { duration: 1200 })
      ),
      -1,
      true
    );
  }, []);
  const tiltStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tilt.value}deg` }],
  }));
  return (
    <EmotionScreen
      iconNode={
        <Ionicons name="phone-portrait-outline" size={120} color={Colors.textMuted} />
      }
      iconAnim={tiltStyle}
      headline={"You open TikTok.\nThen 45 minutes disappear."}
      body={
        "It\u2019s not a willpower problem. It\u2019s a design problem. Your apps are built to keep you stuck."
      }
      onNext={onNext}
    />
  );
}

// Step 2 — The Shift
function ShiftStep({ onNext }: { onNext: () => void }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1000 }),
        withTiming(1.0, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  return (
    <EmotionScreen
      iconNode={
        <Ionicons name="body-outline" size={120} color={Colors.primary} />
      }
      iconAnim={pulseStyle}
      headline={"What if your body\nwas the password?"}
      body={
        "30 seconds of movement before you scroll. That\u2019s it. A tiny gate that changes everything."
      }
      onNext={onNext}
    />
  );
}

// Step 3 — The Promise
function PromiseStep({ onNext }: { onNext: () => void }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1000 }),
        withTiming(1.0, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  return (
    <EmotionScreen
      iconNode={
        <Ionicons name="leaf-outline" size={120} color={Colors.primary} />
      }
      iconAnim={pulseStyle}
      headline={"Move a little.\nScroll a lot less."}
      body={
        "StretchGate doesn\u2019t punish you. It just asks you to show up for your body first."
      }
      onNext={onNext}
    />
  );
}

// ─── Step 4: Focus Areas ──────────────────────────────────────────────────────
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
        <Reanimated.Text
          entering={FadeInDown.duration(400)}
          style={sh.stepHeadline}
        >
          {"Where do you\nhold tension?"}
        </Reanimated.Text>
        <Reanimated.Text
          entering={FadeInDown.duration(400).delay(80)}
          style={sh.stepSub}
        >
          We\u2019ll prioritize stretches for these areas.
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
              <Text
                style={[
                  sh.areaChipText,
                  { color: on ? Colors.white : Colors.textSecondary },
                ]}
              >
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

// ─── Step 5: Duration ─────────────────────────────────────────────────────────
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
        <Reanimated.Text
          entering={FadeInDown.duration(400)}
          style={sh.stepHeadline}
        >
          {"How long can\nyou spare?"}
        </Reanimated.Text>
        <Reanimated.Text
          entering={FadeInDown.duration(400).delay(80)}
          style={sh.stepSub}
        >
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
                <Text
                  style={[
                    sh.durUnit,
                    on && { color: "rgba(255,255,255,0.7)" },
                  ]}
                >
                  s
                </Text>
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[sh.durLabel, on && { color: Colors.white }]}
                >
                  {opt.label}
                </Text>
                {opt.badge && (
                  <View
                    style={[
                      sh.durBadge,
                      on && { backgroundColor: "rgba(255,255,255,0.22)" },
                    ]}
                  >
                    <Text
                      style={[
                        sh.durBadgeText,
                        on && { color: Colors.white },
                      ]}
                    >
                      {opt.badge}
                    </Text>
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

// ─── Step 6: Daily Goal ───────────────────────────────────────────────────────
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
  const numStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numScale.value }],
  }));

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
        <Reanimated.Text
          entering={FadeInDown.duration(400)}
          style={sh.stepHeadline}
        >
          {"How many times\nper day?"}
        </Reanimated.Text>
        <Reanimated.Text
          entering={FadeInDown.duration(400).delay(80)}
          style={sh.stepSub}
        >
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
          <Reanimated.Text style={[sh.goalNum, numStyle]}>
            {goal}
          </Reanimated.Text>
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

// ─── Step 7: App Selection ────────────────────────────────────────────────────
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
        <Reanimated.Text
          entering={FadeInDown.duration(400)}
          style={sh.stepHeadline}
        >
          {"Which apps\nshould require a stretch?"}
        </Reanimated.Text>
        <Reanimated.Text
          entering={FadeInDown.duration(400).delay(80)}
          style={sh.stepSub}
        >
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
            <Pressable
              key={app.id}
              style={sh.appRow}
              onPress={() => toggle(app.id)}
            >
              <View
                style={[
                  sh.appIconBox,
                  { backgroundColor: app.color + "26" },
                ]}
              >
                <Ionicons name={app.icon as any} size={22} color={app.color} />
              </View>
              <Text style={sh.appName}>{app.name}</Text>
              <View
                style={[
                  sh.appCheck,
                  on && {
                    backgroundColor: Colors.primary,
                    borderColor: Colors.primary,
                  },
                ]}
              >
                {on && (
                  <Ionicons name="checkmark" size={13} color={Colors.white} />
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Sticky footer */}
      <View
        style={[
          sh.stickyFooter,
          { paddingBottom: Math.max(bottom + 16, 36) },
        ]}
      >
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

// ─── Step 8: Permissions ──────────────────────────────────────────────────────
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
    console.log("requesting auth");
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
        <Reanimated.Text
          entering={FadeInDown.duration(400)}
          style={sh.stepHeadline}
        >
          One important thing
        </Reanimated.Text>
      </View>

      <View style={{ paddingHorizontal: 24, gap: 14 }}>
        {/* Screen Time */}
        <Reanimated.View
          entering={FadeInDown.duration(400).delay(80)}
          style={sh.permRow}
        >
          <View style={[sh.permIcon, { backgroundColor: Colors.primaryMuted }]}>
            <Ionicons
              name="shield-checkmark-outline"
              size={32}
              color={Colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={sh.permTitleRow}>
              <Text style={sh.permTitle}>Screen Time Access</Text>
              <View style={sh.reqBadge}>
                <Text style={sh.reqBadgeText}>Required</Text>
              </View>
            </View>
            <Text style={sh.permDesc}>
              This lets StretchGate gate your chosen apps. Only you control
              it \u2014 you can turn it off in Settings anytime.
            </Text>
          </View>
        </Reanimated.View>

        {/* Notifications */}
        <Reanimated.View
          entering={FadeInDown.duration(400).delay(160)}
          style={sh.permRow}
        >
          <View style={[sh.permIcon, { backgroundColor: Colors.accentMuted }]}>
            <Ionicons
              name="notifications-outline"
              size={32}
              color={Colors.accent}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[sh.permTitle, { marginBottom: 4 }]}>
              Daily Reminders
            </Text>
            <Text style={sh.permDesc}>
              Optional nudges to keep your streak going. No spam \u2014 one
              reminder a day at most.
            </Text>
          </View>
          <Switch
            value={notifOn}
            onValueChange={setNotifOn}
            trackColor={{ false: Colors.divider, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </Reanimated.View>

        <Reanimated.Text
          entering={FadeInDown.duration(400).delay(240)}
          style={sh.reassure}
        >
          {"🔒 Your data never leaves your device."}
        </Reanimated.Text>
      </View>

      <View style={{ flex: 1 }} />

      <View
        style={{ paddingHorizontal: 24, paddingBottom: Math.max(bottom + 16, 36) }}
      >
        <Pressable
          style={[sh.nextBtn, loading && { opacity: 0.7 }]}
          onPress={handleGrant}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={sh.nextBtnText}>Grant Screen Time Access</Text>
          )}
        </Pressable>
        {!!error && <Text style={sh.permError}>{error}</Text>}
        <Pressable style={sh.skipLink} onPress={onNext}>
          <Text style={sh.skipLinkText}>
            Skip for now \u2014 I\u2019ll set this up later
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Step 9: Completion ───────────────────────────────────────────────────────
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
  const { bottom } = useSafeAreaInsets();
  const checkScale = useSharedValue(0);
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  useEffect(() => {
    checkScale.value = withSpring(1, { damping: 12, stiffness: 80 });
  }, []);

  const handleFinish = async () => {
    if (Platform.OS !== "web")
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onFinish();
  };

  const areasLabel =
    selectedAreas.length > 0 ? `${selectedAreas.length}` : "All";
  const stats = [
    `\u2736  ${areasLabel} body area${selectedAreas.length === 1 ? "" : "s"} targeted`,
    `\u2736  ${selectedApps.length} app${selectedApps.length === 1 ? "" : "s"} gated`,
    `\u2736  ${selectedDuration}s stretches`,
  ];

  return (
    <View
      style={[
        cmp.container,
        { paddingBottom: Math.max(bottom + 24, 44) },
      ]}
    >
      <View style={cmp.content}>
        <Reanimated.View style={[cmp.checkWrap, checkStyle]}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.white} />
        </Reanimated.View>
        <Reanimated.Text
          entering={FadeInDown.duration(500).delay(200)}
          style={cmp.headline}
        >
          You\u2019re ready.
        </Reanimated.Text>
        <Reanimated.Text
          entering={FadeInDown.duration(500).delay(380)}
          style={cmp.sub}
        >
          {"Every stretch is a small win.\nEvery scroll is earned."}
        </Reanimated.Text>
        <View style={cmp.statsBlock}>
          {stats.map((s, i) => (
            <Reanimated.Text
              key={i}
              entering={FadeInDown.duration(400).delay(520 + i * 100)}
              style={cmp.stat}
            >
              {s}
            </Reanimated.Text>
          ))}
        </View>
      </View>
      <Pressable style={cmp.cta} onPress={handleFinish}>
        <Text style={cmp.ctaText}>Start Moving</Text>
      </Pressable>
    </View>
  );
}

const cmp = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 90,
  },
  content: { alignItems: "center", gap: 22 },
  checkWrap: { marginBottom: 4 },
  headline: {
    fontSize: 38,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.white,
    textAlign: "center",
  },
  sub: {
    fontSize: 18,
    fontFamily: "DM_Sans_400Regular",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 28,
  },
  statsBlock: { gap: 10, marginTop: 6 },
  stat: {
    fontSize: 14,
    fontFamily: "DM_Sans_400Regular",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  cta: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingVertical: 18,
    width: "100%",
    alignItems: "center",
  },
  ctaText: {
    fontSize: 17,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.primary,
  },
});

// ─── Root Onboarding Screen ───────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { updateSettings } = useApp();

  const [step, setStep] = useState(0);
  const [canTapSplash, setCanTapSplash] = useState(false);

  // Collected personalization
  const [selectedAreas, setSelectedAreas] = useState<BodyArea[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<DurOpt>(45);
  const [dailyGoal, setDailyGoal] = useState(3);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(false);

  // Cross-fade between steps
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goNext = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep((s) => s + 1);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  // Splash: tap allowed after 2s, auto-advance at 5s
  useEffect(() => {
    if (step !== 0) return;
    const tapT = setTimeout(() => setCanTapSplash(true), 2000);
    const autoT = setTimeout(goNext, 5000);
    return () => {
      clearTimeout(tapT);
      clearTimeout(autoT);
    };
  }, [step, goNext]);

  const handleFinish = useCallback(async () => {
    await updateSettings({
      focusBodyAreas: selectedAreas,
      preferredDuration: selectedDuration,
      dailyGoal,
      lockedApps: selectedApps,
      reminderEnabled: notifEnabled,
      hasCompletedOnboarding: true,
    });
    router.replace("/(tabs)/");
  }, [
    updateSettings,
    selectedAreas,
    selectedDuration,
    dailyGoal,
    selectedApps,
    notifEnabled,
  ]);

  const renderStep = () => {
    switch (step) {
      case 0:
        return <SplashStep onAdvance={goNext} canTap={canTapSplash} />;
      case 1:
        return <ProblemStep onNext={goNext} />;
      case 2:
        return <ShiftStep onNext={goNext} />;
      case 3:
        return <PromiseStep onNext={goNext} />;
      case 4:
        return (
          <FocusAreasStep
            selected={selectedAreas}
            setSelected={setSelectedAreas}
            onNext={goNext}
          />
        );
      case 5:
        return (
          <DurationStep
            selected={selectedDuration}
            setSelected={setSelectedDuration}
            onNext={goNext}
          />
        );
      case 6:
        return (
          <DailyGoalStep
            goal={dailyGoal}
            setGoal={setDailyGoal}
            onNext={goNext}
          />
        );
      case 7:
        return (
          <AppSelectionStep
            selected={selectedApps}
            setSelected={setSelectedApps}
            onNext={goNext}
          />
        );
      case 8:
        return (
          <PermissionsStep
            notifOn={notifEnabled}
            setNotifOn={setNotifEnabled}
            onNext={goNext}
          />
        );
      case 9:
        return (
          <CompletionStep
            selectedAreas={selectedAreas}
            selectedApps={selectedApps}
            selectedDuration={selectedDuration}
            onFinish={handleFinish}
          />
        );
      default:
        return null;
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
  // Next button
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
  // Step header
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
  // Focus areas pill grid
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
  areaChipText: {
    fontSize: 15,
    fontFamily: "DM_Sans_600SemiBold",
  },
  // Duration
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
  durCardOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
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
  // Daily goal
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
  // App selection
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
  // Permissions
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
  reassure: {
    fontSize: 12,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 6,
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
