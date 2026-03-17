import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { BODY_AREAS, DISTRACTING_APPS, BodyArea } from "@/constants/stretches";
import { useApp } from "@/context/AppContext";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Move Before\nYou Scroll',
    subtitle: 'StretchGate helps you build healthy habits by adding a quick stretch before opening distracting apps.',
    icon: 'body-outline',
    color: Colors.primaryLight,
  },
  {
    id: 'how',
    title: 'How It Works',
    subtitle: 'You choose which apps to lock. Before you can open them, you complete a 20–60 second guided stretch. Then the app is yours.',
    icon: 'lock-open-outline',
    color: Colors.accentWarm,
  },
  {
    id: 'wellness',
    title: 'Feel the\nDifference',
    subtitle: 'Even 30 seconds of stretching relieves tension, resets your posture, and gives your eyes a break. Small habits, big impact.',
    icon: 'heart-outline',
    color: Colors.softMint,
  },
];

function WelcomeSlide() {
  return (
    <View style={styles.slide}>
      <Animated.View entering={FadeIn.duration(600)} style={styles.heroIcon}>
        <Ionicons name="body-outline" size={80} color={Colors.primaryLight} />
      </Animated.View>
      <Animated.Text entering={FadeInDown.duration(600).delay(200)} style={styles.heroTitle}>
        Move Before{'\n'}You Scroll
      </Animated.Text>
      <Animated.Text entering={FadeInDown.duration(600).delay(350)} style={styles.heroSub}>
        StretchGate helps you build healthy habits by adding a quick stretch before opening distracting apps.
      </Animated.Text>
    </View>
  );
}

function HowItWorksSlide() {
  const steps = [
    { icon: 'phone-portrait-outline', label: 'Choose apps to lock', color: Colors.accentWarm },
    { icon: 'timer-outline', label: 'Complete a 20–60s stretch', color: Colors.primaryLight },
    { icon: 'checkmark-circle-outline', label: 'App unlocks — enjoy!', color: Colors.softMint },
  ];
  return (
    <View style={styles.slide}>
      <Animated.Text entering={FadeInDown.duration(500)} style={styles.heroTitle}>
        How It Works
      </Animated.Text>
      <View style={styles.stepsList}>
        {steps.map((step, i) => (
          <Animated.View
            key={step.label}
            entering={FadeInDown.duration(500).delay(i * 120)}
            style={styles.step}
          >
            <View style={[styles.stepIcon, { backgroundColor: step.color + '20' }]}>
              <Ionicons name={step.icon as any} size={24} color={step.color} />
            </View>
            <Text style={styles.stepLabel}>{step.label}</Text>
          </Animated.View>
        ))}
      </View>
      <Animated.Text entering={FadeInDown.duration(500).delay(400)} style={styles.heroSub}>
        No Screen Time API needed. You complete the stretch manually — it's the honor system. And it works.
      </Animated.Text>
    </View>
  );
}

function WellnessSlide() {
  return (
    <View style={styles.slide}>
      <Animated.View entering={FadeIn.duration(600)} style={styles.heroIcon}>
        <Ionicons name="heart-outline" size={80} color={Colors.softMint} />
      </Animated.View>
      <Animated.Text entering={FadeInDown.duration(600).delay(200)} style={styles.heroTitle}>
        Feel the{'\n'}Difference
      </Animated.Text>
      <Animated.Text entering={FadeInDown.duration(600).delay(350)} style={styles.heroSub}>
        Even 30 seconds of stretching relieves tension, resets your posture, and gives your eyes a break. Small habits, big impact.
      </Animated.Text>
    </View>
  );
}

function AppSelectionStep({ onDone }: { onDone: (apps: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = async (id: string) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    setSelected(s => s.includes(id) ? s.filter(a => a !== id) : [...s, id]);
  };

  return (
    <View style={styles.slide}>
      <Animated.Text entering={FadeInDown.duration(500)} style={styles.heroTitle}>
        Which Apps{'\n'}Distract You?
      </Animated.Text>
      <Animated.Text entering={FadeInDown.duration(500).delay(100)} style={styles.heroSub}>
        Select the apps you want to use mindfully. You can change this anytime.
      </Animated.Text>
      <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.appGrid}>
        {DISTRACTING_APPS.map(app => {
          const isSelected = selected.includes(app.id);
          return (
            <Pressable
              key={app.id}
              style={[styles.appChip, isSelected && styles.appChipSelected]}
              onPress={() => toggle(app.id)}
            >
              <Ionicons
                name={app.icon as any}
                size={18}
                color={isSelected ? Colors.primaryDeep : Colors.textSecondary}
              />
              <Text style={[styles.appChipText, isSelected && styles.appChipTextSelected]}>
                {app.name}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
      <Animated.View entering={FadeInUp.duration(500).delay(300)}>
        <Pressable style={styles.nextBtn} onPress={() => onDone(selected)}>
          <Text style={styles.nextBtnText}>
            {selected.length === 0 ? 'Skip for now' : `Lock ${selected.length} App${selected.length > 1 ? 's' : ''}`}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.primaryDeep} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

function BodyAreaStep({ onDone }: { onDone: (areas: BodyArea[]) => void }) {
  const [selected, setSelected] = useState<BodyArea[]>([]);

  const toggle = async (id: BodyArea) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    setSelected(s => s.includes(id) ? s.filter(a => a !== id) : [...s, id]);
  };

  return (
    <View style={styles.slide}>
      <Animated.Text entering={FadeInDown.duration(500)} style={styles.heroTitle}>
        Where Do You{'\n'}Hold Tension?
      </Animated.Text>
      <Animated.Text entering={FadeInDown.duration(500).delay(100)} style={styles.heroSub}>
        We'll personalize stretches to your needs. Skip to get a mix of everything.
      </Animated.Text>
      <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.areaGrid}>
        {BODY_AREAS.map(area => {
          const isSelected = selected.includes(area.id);
          return (
            <Pressable
              key={area.id}
              style={[styles.areaCard, isSelected && styles.areaCardSelected]}
              onPress={() => toggle(area.id)}
            >
              <Ionicons
                name={area.icon as any}
                size={26}
                color={isSelected ? Colors.primaryDeep : Colors.textSecondary}
              />
              <Text style={[styles.areaCardLabel, isSelected && styles.areaCardLabelSelected]}>
                {area.label}
              </Text>
              <Text style={[styles.areaCardDesc, isSelected && { color: Colors.primaryDeep + 'aa' }]}>
                {area.description}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
      <Animated.View entering={FadeInUp.duration(500).delay(300)}>
        <Pressable style={styles.nextBtn} onPress={() => onDone(selected)}>
          <Text style={styles.nextBtnText}>
            {selected.length === 0 ? 'Give me variety' : `Focus on ${selected.length} area${selected.length > 1 ? 's' : ''}`}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.primaryDeep} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

function ReadyStep({ onDone }: { onDone: () => void }) {
  return (
    <View style={styles.slide}>
      <Animated.View entering={FadeIn.duration(700)} style={styles.heroIcon}>
        <Ionicons name="checkmark-circle" size={80} color={Colors.softMint} />
      </Animated.View>
      <Animated.Text entering={FadeInDown.duration(600).delay(200)} style={styles.heroTitle}>
        You're All Set!
      </Animated.Text>
      <Animated.Text entering={FadeInDown.duration(600).delay(350)} style={styles.heroSub}>
        Every time you reach for a distracting app, remember: one short stretch first. Your body will thank you.
      </Animated.Text>
      <Animated.View entering={FadeInUp.duration(600).delay(500)}>
        <Pressable style={styles.startBtn} onPress={onDone}>
          <Text style={styles.startBtnText}>Start StretchGate</Text>
          <Ionicons name="arrow-forward-circle" size={22} color={Colors.primaryDeep} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { updateSettings } = useApp();
  const [step, setStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const totalInfoSlides = SLIDES.length;
  const appStep = totalInfoSlides;
  const bodyStep = totalInfoSlides + 1;
  const readyStep = totalInfoSlides + 2;

  const goToStep = async (s: number) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(s);
  };

  const handleInfoNext = () => {
    if (step < totalInfoSlides - 1) {
      goToStep(step + 1);
    } else {
      goToStep(appStep);
    }
  };

  const handleAppsDone = async (apps: string[]) => {
    await updateSettings({ lockedApps: apps });
    goToStep(bodyStep);
  };

  const handleAreasDone = async (areas: BodyArea[]) => {
    await updateSettings({ focusBodyAreas: areas });
    goToStep(readyStep);
  };

  const handleFinish = async () => {
    await updateSettings({ hasCompletedOnboarding: true });
    router.replace('/(tabs)');
  };

  const renderContent = () => {
    if (step < totalInfoSlides) {
      const slide = SLIDES[step];
      if (step === 0) return <WelcomeSlide />;
      if (step === 1) return <HowItWorksSlide />;
      return <WellnessSlide />;
    }
    if (step === appStep) return <AppSelectionStep onDone={handleAppsDone} />;
    if (step === bodyStep) return <BodyAreaStep onDone={handleAreasDone} />;
    return <ReadyStep onDone={handleFinish} />;
  };

  const isInfoSlide = step < totalInfoSlides;
  const totalDots = totalInfoSlides;
  const progress = step / (readyStep);

  return (
    <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {renderContent()}
      </ScrollView>

      {isInfoSlide && (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.bottomNav}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.dotActive]}
              />
            ))}
          </View>
          <Pressable style={styles.nextBtnSmall} onPress={handleInfoNext}>
            <Text style={styles.nextBtnSmallText}>
              {step === totalInfoSlides - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primaryDeep} />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 0,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryLight,
    borderRadius: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  slide: {
    paddingHorizontal: 28,
    paddingVertical: 32,
    minHeight: 500,
    justifyContent: 'center',
  },
  heroIcon: {
    alignSelf: 'center',
    width: 130,
    height: 130,
    borderRadius: 36,
    backgroundColor: 'rgba(122, 184, 147, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  heroTitle: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    lineHeight: 44,
    marginBottom: 16,
  },
  heroSub: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  stepsList: { gap: 14, marginVertical: 24 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  stepIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { flex: 1, fontSize: 16, fontFamily: 'Inter_500Medium', color: Colors.text },
  appGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  appChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  appChipSelected: {
    backgroundColor: Colors.softMint,
    borderColor: Colors.primaryLight,
  },
  appChipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  appChipTextSelected: { color: Colors.primaryDeep },
  areaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  areaCard: {
    width: (SCREEN_WIDTH - 56 - 10) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 6,
  },
  areaCardSelected: {
    backgroundColor: Colors.softMint,
    borderColor: Colors.primaryLight,
  },
  areaCardLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  areaCardLabelSelected: { color: Colors.primaryDeep },
  areaCardDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.softMint,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  nextBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primaryDeep,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.softMint,
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
  },
  startBtnText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.primaryDeep,
  },
  bottomNav: {
    paddingHorizontal: 28,
    paddingBottom: 20,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: Colors.primaryLight,
    width: 20,
  },
  nextBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.softMint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
  },
  nextBtnSmallText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primaryDeep,
  },
});
