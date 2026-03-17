import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
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
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
  cancelAnimation,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { STRETCHES, getRandomStretch } from "@/constants/stretches";
import { useApp } from "@/context/AppContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type SessionPhase = 'prep' | 'active' | 'done';

function BreathingOrb({ isActive }: { isActive: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 3800, easing: Easing.inOut(Easing.sine) }),
          withTiming(1, { duration: 3800, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 3800, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.5, { duration: 3800, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withTiming(1, { duration: 600 });
      opacity.value = withTiming(0.6, { duration: 600 });
    }
  }, [isActive]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const innerScale = useSharedValue(1);
  useEffect(() => {
    if (isActive) {
      innerScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 3800, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.95, { duration: 3800, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(innerScale);
      innerScale.value = withTiming(1, { duration: 600 });
    }
  }, [isActive]);

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  return (
    <Animated.View style={[styles.orbOuter, outerStyle]}>
      <Animated.View style={[styles.orbInner, innerStyle]} />
    </Animated.View>
  );
}

function CircularTimer({ progress, duration }: { progress: number; duration: number }) {
  const size = 200;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <BreathingOrb isActive={progress > 0 && progress < 1} />
    </View>
  );
}

export default function StretchSessionScreen() {
  const { stretchId, targetApp } = useLocalSearchParams<{ stretchId?: string; targetApp?: string }>();
  const { settings, recordSession } = useApp();
  const insets = useSafeAreaInsets();

  const stretch = stretchId
    ? STRETCHES.find(s => s.id === stretchId) ?? getRandomStretch(settings.focusBodyAreas)
    : getRandomStretch(settings.focusBodyAreas);

  const duration = Math.max(stretch.durationSeconds, settings.preferredDuration);
  const [phase, setPhase] = useState<SessionPhase>('prep');
  const [timeLeft, setTimeLeft] = useState(duration);
  const [currentStep, setCurrentStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const progress = 1 - (timeLeft / duration);

  const progressAnim = useSharedValue(0);

  const handleStart = useCallback(async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPhase('active');
    startTimeRef.current = Date.now();
    setTimeLeft(duration);
    progressAnim.value = 0;
    progressAnim.value = withTiming(1, { duration: duration * 1000, easing: Easing.linear });

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(Math.ceil(remaining));

      const stepIndex = Math.min(
        Math.floor((elapsed / duration) * stretch.instructions.length),
        stretch.instructions.length - 1
      );
      setCurrentStep(stepIndex);

      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPhase('done');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }, 200);
  }, [duration, stretch]);

  const handleComplete = useCallback(async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await recordSession({
      stretchId: stretch.id,
      stretchName: stretch.name,
      durationSeconds: duration,
      targetApp: targetApp || undefined,
    });
    router.back();
  }, [stretch, duration, targetApp, recordSession]);

  const handleSkip = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    router.back();
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%` as any,
  }));

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}`;
  };

  if (phase === 'done') {
    return (
      <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.doneContainer}>
          <View style={styles.doneCircle}>
            <Ionicons name="checkmark" size={60} color={Colors.primaryDeep} />
          </View>
          <Text style={styles.doneTitle}>Stretch Complete!</Text>
          <Text style={styles.doneSub}>
            {duration} seconds well spent.{'\n'}Your body appreciates you.
          </Text>

          {targetApp && (
            <View style={styles.unlockBadge}>
              <Ionicons name="lock-open-outline" size={18} color={Colors.accentWarm} />
              <Text style={styles.unlockText}>{targetApp} unlocked</Text>
            </View>
          )}

          <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.doneBtns}>
            <Pressable style={styles.doneBtn} onPress={handleComplete}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  if (phase === 'prep') {
    return (
      <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={handleSkip}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.duration(600)} style={styles.prepContent}>
          <View style={styles.prepIcon}>
            <Ionicons name={stretch.icon as any} size={56} color={Colors.primaryLight} />
          </View>
          <Text style={styles.prepName}>{stretch.name}</Text>
          <Text style={styles.prepDesc}>{stretch.description}</Text>
          <Text style={styles.prepDuration}>{duration} seconds</Text>

          <View style={styles.prepFirstStep}>
            <Text style={styles.prepFirstStepLabel}>To start:</Text>
            <Text style={styles.prepFirstStepText}>{stretch.instructions[0]}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.prepBottom}>
          <Text style={styles.breathingHint}>{stretch.breathingCue}</Text>
          <Pressable style={styles.startBtn} onPress={handleStart}>
            <Ionicons name="play" size={22} color={Colors.primaryDeep} />
            <Text style={styles.startBtnText}>Begin Stretch</Text>
          </Pressable>
          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <View style={styles.activeProgressTrack}>
        <Animated.View style={[styles.activeProgressFill, progressBarStyle]} />
      </View>

      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={handleSkip}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.activeContent}>
        <View style={styles.orbContainer}>
          <BreathingOrb isActive={true} />
          <Text style={styles.stretchNameActive}>{stretch.name}</Text>
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.stepLabel}>
            Step {currentStep + 1} of {stretch.instructions.length}
          </Text>
          <Animated.Text key={currentStep} entering={FadeIn.duration(400)} style={styles.stepText}>
            {stretch.instructions[currentStep]}
          </Animated.Text>
        </View>

        <View style={styles.breathingCueBox}>
          <Ionicons name="leaf-outline" size={16} color={Colors.primaryLight} />
          <Text style={styles.breathingCueText}>{stretch.breathingCue}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  activeProgressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  activeProgressFill: {
    height: '100%',
    backgroundColor: Colors.primaryLight,
  },
  prepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  prepIcon: {
    width: 120,
    height: 120,
    borderRadius: 34,
    backgroundColor: 'rgba(122, 184, 147, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  prepName: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  prepDesc: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  prepDuration: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.accentWarm,
    marginBottom: 24,
  },
  prepFirstStep: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  prepFirstStepLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primaryLight,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prepFirstStepText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    lineHeight: 21,
  },
  prepBottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  breathingHint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.softMint,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
  },
  startBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.primaryDeep,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  activeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  orbContainer: {
    alignItems: 'center',
    gap: 20,
  },
  orbOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(122, 184, 147, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(122, 184, 147, 0.25)',
  },
  stretchNameActive: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    textAlign: 'center',
  },
  instructionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    width: '100%',
  },
  stepLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primaryLight,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepText: {
    fontSize: 17,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    lineHeight: 26,
  },
  breathingCueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(122,184,147,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  breathingCueText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    flex: 1,
  },
  doneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  doneCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.softMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  doneTitle: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  doneSub: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  unlockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(200, 168, 107, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 32,
  },
  unlockText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.accentWarm,
  },
  doneBtns: { width: '100%', gap: 12 },
  doneBtn: {
    backgroundColor: Colors.softMint,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.primaryDeep,
  },
});
