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
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { BODY_AREAS, DISTRACTING_APPS, BodyArea } from "@/constants/stretches";
import { useApp } from "@/context/AppContext";

const { width: W } = Dimensions.get("window");

type Step =
  | "welcome"
  | "how"
  | "apps"
  | "areas"
  | "notifications"
  | "ready";

const INFO_STEPS: Step[] = ["welcome", "how"];

function NextBtn({
  label,
  onPress,
  icon = "arrow-forward",
}: {
  label: string;
  onPress: () => void;
  icon?: string;
}) {
  return (
    <Pressable style={styles.nextBtn} onPress={onPress}>
      <Text style={styles.nextBtnText}>{label}</Text>
      <Ionicons name={icon as any} size={18} color={Colors.textInverted} />
    </Pressable>
  );
}

function SkipBtn({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.skipBtn} onPress={onPress}>
      <Text style={styles.skipBtnText}>Skip</Text>
    </Pressable>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.step}>
      <Animated.View entering={FadeIn.duration(700)} style={styles.heroBox}>
        <Ionicons name="body-outline" size={64} color={Colors.primary} />
      </Animated.View>
      <Animated.Text entering={FadeInDown.duration(600).delay(200)} style={styles.h1}>
        Move Before{"\n"}You Scroll
      </Animated.Text>
      <Animated.Text entering={FadeInDown.duration(600).delay(350)} style={styles.body}>
        StretchGate adds a tiny wellness gate before your most distracting apps.
        30 seconds of movement, then you're in.
      </Animated.Text>
      <Animated.View entering={FadeInUp.duration(500).delay(500)} style={styles.stepFooter}>
        <NextBtn label="Get started" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

function HowStep({ onNext }: { onNext: () => void }) {
  const steps = [
    {
      icon: "lock-closed-outline",
      color: Colors.accent,
      title: "Pick your apps",
      sub: "Choose which apps require a stretch",
    },
    {
      icon: "timer-outline",
      color: Colors.primary,
      title: "Complete a stretch",
      sub: "20–60 seconds, guided by the app",
    },
    {
      icon: "checkmark-circle-outline",
      color: Colors.primaryLight,
      title: "Open the app",
      sub: "Honor system — no Screen Time API needed",
    },
  ];

  return (
    <View style={styles.step}>
      <Animated.Text entering={FadeInDown.duration(500)} style={styles.h1}>
        Here's how{"\n"}it works
      </Animated.Text>
      <View style={styles.stepList}>
        {steps.map((s, i) => (
          <Animated.View
            key={s.title}
            entering={FadeInDown.duration(500).delay(i * 100 + 100)}
            style={styles.stepCard}
          >
            <View
              style={[styles.stepCardIcon, { backgroundColor: s.color + "20" }]}
            >
              <Ionicons name={s.icon as any} size={22} color={s.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepCardTitle}>{s.title}</Text>
              <Text style={styles.stepCardSub}>{s.sub}</Text>
            </View>
          </Animated.View>
        ))}
      </View>
      <Animated.View entering={FadeInUp.duration(500).delay(500)} style={styles.stepFooter}>
        <NextBtn label="Choose my apps" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

function AppsStep({
  onNext,
}: {
  onNext: (apps: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = async (id: string) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    setSelected((s) =>
      s.includes(id) ? s.filter((a) => a !== id) : [...s, id]
    );
  };

  return (
    <View style={styles.step}>
      <Animated.Text entering={FadeInDown.duration(500)} style={styles.h1}>
        Which apps{"\n"}distract you most?
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.duration(500).delay(100)}
        style={styles.body}
      >
        You'll stretch before opening these. You can change this anytime in Settings.
      </Animated.Text>
      <Animated.View
        entering={FadeInDown.duration(500).delay(200)}
        style={styles.appGrid}
      >
        {DISTRACTING_APPS.map((app) => {
          const on = selected.includes(app.id);
          return (
            <Pressable
              key={app.id}
              style={[styles.appChip, on && styles.appChipOn]}
              onPress={() => toggle(app.id)}
            >
              <Ionicons
                name={app.icon as any}
                size={16}
                color={on ? Colors.textInverted : Colors.textSecondary}
              />
              <Text style={[styles.appChipText, on && styles.appChipTextOn]}>
                {app.name}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
      <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.stepFooter}>
        <NextBtn
          label={
            selected.length === 0
              ? "Skip for now"
              : `Lock ${selected.length} app${selected.length > 1 ? "s" : ""}`
          }
          onPress={() => onNext(selected)}
        />
      </Animated.View>
    </View>
  );
}

function AreasStep({
  onNext,
}: {
  onNext: (areas: BodyArea[]) => void;
}) {
  const [selected, setSelected] = useState<BodyArea[]>([]);

  const toggle = async (id: BodyArea) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    setSelected((s) =>
      s.includes(id) ? s.filter((a) => a !== id) : [...s, id]
    );
  };

  return (
    <View style={styles.step}>
      <Animated.Text entering={FadeInDown.duration(500)} style={styles.h1}>
        Where do you{"\n"}hold tension?
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.duration(500).delay(100)}
        style={styles.body}
      >
        We'll serve stretches tailored to you. Skip for a balanced mix.
      </Animated.Text>
      <Animated.View
        entering={FadeInDown.duration(500).delay(200)}
        style={styles.areaGrid}
      >
        {BODY_AREAS.map((area) => {
          const on = selected.includes(area.id);
          return (
            <Pressable
              key={area.id}
              style={[styles.areaCard, on && styles.areaCardOn]}
              onPress={() => toggle(area.id)}
            >
              <Ionicons
                name={area.icon as any}
                size={24}
                color={on ? Colors.textInverted : Colors.textSecondary}
              />
              <Text style={[styles.areaLabel, on && styles.areaLabelOn]}>
                {area.label}
              </Text>
              <Text style={[styles.areaSub, on && { color: "rgba(13,31,26,0.6)" }]}>
                {area.description}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
      <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.stepFooter}>
        <NextBtn
          label={
            selected.length === 0
              ? "Give me variety"
              : `Focus on ${selected.length} area${selected.length > 1 ? "s" : ""}`
          }
          onPress={() => onNext(selected)}
        />
      </Animated.View>
    </View>
  );
}

function NotificationsStep({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const [requesting, setRequesting] = useState(false);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      if (Platform.OS !== "web") {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === "granted") {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Time to stretch",
              body: "Take 30 seconds to reset your body",
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: 10,
              minute: 0,
              repeats: true,
            },
          });
        }
      }
    } catch (e) {
      console.warn("Notification error", e);
    }
    setRequesting(false);
    onNext();
  };

  return (
    <View style={styles.step}>
      <Animated.View entering={FadeIn.duration(600)} style={styles.heroBox}>
        <Ionicons name="notifications-outline" size={60} color={Colors.accent} />
      </Animated.View>
      <Animated.Text entering={FadeInDown.duration(500).delay(150)} style={styles.h1}>
        Daily stretch{"\n"}reminders
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.duration(500).delay(300)}
        style={styles.body}
      >
        We'll send a gentle nudge each morning to help you build a consistent
        habit. No spam, just one daily reminder.
      </Animated.Text>
      <Animated.View entering={FadeInDown.duration(500).delay(450)} style={styles.permRow}>
        <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
        <Text style={styles.permNote}>One notification per day. Turn off anytime.</Text>
      </Animated.View>
      <Animated.View entering={FadeInUp.duration(500).delay(550)} style={styles.stepFooter}>
        <NextBtn
          label={requesting ? "Setting up..." : "Allow notifications"}
          onPress={handleAllow}
          icon="notifications-outline"
        />
        <SkipBtn onPress={onSkip} />
      </Animated.View>
    </View>
  );
}

function ReadyStep({ onDone }: { onDone: () => void }) {
  return (
    <View style={styles.step}>
      <Animated.View entering={FadeIn.duration(700)} style={[styles.heroBox, { backgroundColor: Colors.primaryMuted }]}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.primary} />
      </Animated.View>
      <Animated.Text entering={FadeInDown.duration(600).delay(200)} style={styles.h1}>
        You're all set!
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.duration(600).delay(350)}
        style={styles.body}
      >
        Every time you reach for a distracting app, take one breath, do your
        stretch, and then enjoy your scroll. Your body will thank you.
      </Animated.Text>
      <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.stepFooter}>
        <Pressable style={styles.launchBtn} onPress={onDone}>
          <Text style={styles.launchBtnText}>Start StretchGate</Text>
          <Ionicons name="arrow-forward-circle" size={22} color={Colors.textInverted} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { updateSettings } = useApp();
  const [step, setStep] = useState<Step>("welcome");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const allSteps: Step[] = ["welcome", "how", "apps", "areas", "notifications", "ready"];
  const stepIdx = allSteps.indexOf(step);
  const progress = (stepIdx + 1) / allSteps.length;

  const go = async (next: Step) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(next);
  };

  const finish = async () => {
    await updateSettings({ hasCompletedOnboarding: true });
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Back button (not on first step) */}
      {stepIdx > 0 && (
        <Pressable
          style={styles.backBtn}
          onPress={() => setStep(allSteps[stepIdx - 1])}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
        </Pressable>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {step === "welcome" && (
          <WelcomeStep onNext={() => go("how")} />
        )}
        {step === "how" && (
          <HowStep onNext={() => go("apps")} />
        )}
        {step === "apps" && (
          <AppsStep
            onNext={async (apps) => {
              await updateSettings({ lockedApps: apps });
              go("areas");
            }}
          />
        )}
        {step === "areas" && (
          <AreasStep
            onNext={async (areas) => {
              await updateSettings({ focusBodyAreas: areas });
              go("notifications");
            }}
          />
        )}
        {step === "notifications" && (
          <NotificationsStep
            onNext={() => go("ready")}
            onSkip={() => go("ready")}
          />
        )}
        {step === "ready" && <ReadyStep onDone={finish} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  progressTrack: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  backBtn: {
    position: "absolute",
    top: 12,
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { flexGrow: 1 },
  step: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 20,
    minHeight: 560,
    justifyContent: "flex-start",
  },
  heroBox: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: Colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  h1: {
    fontSize: 34,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
    lineHeight: 42,
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 28,
  },
  stepList: { gap: 12, marginBottom: 28 },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
  },
  stepCardIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCardTitle: {
    fontSize: 15,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.text,
    marginBottom: 3,
  },
  stepCardSub: {
    fontSize: 13,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
  },
  appGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  appChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  appChipOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  appChipText: {
    fontSize: 13,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textSecondary,
  },
  appChipTextOn: { color: Colors.textInverted },
  areaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  areaCard: {
    width: (W - 56 - 10) / 2,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  areaCardOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  areaLabel: {
    fontSize: 15,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.text,
  },
  areaLabelOn: { color: Colors.textInverted },
  areaSub: {
    fontSize: 11,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
  },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primaryMuted,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
  },
  permNote: {
    fontSize: 13,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  stepFooter: { gap: 10, marginTop: "auto", paddingTop: 20 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
  },
  nextBtnText: {
    fontSize: 17,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.textInverted,
  },
  skipBtn: { alignItems: "center", paddingVertical: 10 },
  skipBtnText: {
    fontSize: 14,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
  },
  launchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
  },
  launchBtnText: {
    fontSize: 18,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.textInverted,
  },
});
