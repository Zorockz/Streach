import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { STRETCHES } from "@/constants/stretches";

export default function StretchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const stretch = STRETCHES.find(s => s.id === id);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!stretch) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Stretch not found</Text>
      </View>
    );
  }

  const handleStart = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/stretch/session', params: { stretchId: stretch.id } });
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.heroSection}>
          <View style={styles.stretchIconBig}>
            <Ionicons name={stretch.icon as any} size={56} color={Colors.primaryLight} />
          </View>
          <Text style={styles.stretchName}>{stretch.name}</Text>
          <Text style={styles.stretchDesc}>{stretch.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="timer-outline" size={14} color={Colors.accentWarm} />
              <Text style={styles.metaText}>{stretch.durationSeconds}s</Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="speedometer-outline" size={14} color={Colors.primaryLight} />
              <Text style={styles.metaText}>{stretch.difficulty}</Text>
            </View>
            {stretch.bodyArea.map(a => (
              <View key={a} style={styles.metaBadge}>
                <Text style={styles.metaText}>{a}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>How to do it</Text>
          {stretch.instructions.map((step, i) => (
            <View key={i} style={styles.instructionRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{step}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.breathingCard}>
          <Ionicons name="leaf-outline" size={20} color={Colors.primaryLight} />
          <View style={{ flex: 1 }}>
            <Text style={styles.breathingTitle}>Breathing</Text>
            <Text style={styles.breathingText}>{stretch.breathingCue}</Text>
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.startBtnContainer}>
        <Pressable style={styles.startBtn} onPress={handleStart}>
          <Ionicons name="play-circle-outline" size={24} color={Colors.primaryDeep} />
          <Text style={styles.startBtnText}>Start Stretch · {stretch.durationSeconds}s</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  errorText: { color: Colors.text, textAlign: 'center', marginTop: 40, fontFamily: 'Inter_500Medium', fontSize: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  stretchIconBig: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: 'rgba(122, 184, 147, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stretchName: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  stretchDesc: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  metaText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, textTransform: 'capitalize' },
  section: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 14,
  },
  instructionRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(122, 184, 147, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.primaryLight },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  breathingCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(122, 184, 147, 0.1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(122, 184, 147, 0.2)',
    marginBottom: 16,
  },
  breathingTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.primaryLight, marginBottom: 4 },
  breathingText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, lineHeight: 19 },
  startBtnContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: Colors.background,
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
});
