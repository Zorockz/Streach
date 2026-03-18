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
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { StretchIcon } from "@/components/StretchIcon";
import { STRETCHES, STRETCH_CATEGORIES } from "@/constants/stretches";

export default function StretchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const stretch = STRETCHES.find(s => s.id === id);
  const primaryArea = stretch?.bodyArea[0];
  const cat = STRETCH_CATEGORIES.find(c => c.id === primaryArea);

  if (!stretch || !cat) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Stretch not found</Text>
        <Pressable onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const handleStart = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/stretch/session", params: { stretchId: stretch.id } });
  };

  const d = stretch.durationSeconds;
  const dLabel = d < 60 ? `${d}s` : `${Math.floor(d / 60)}m${d % 60 > 0 ? ` ${d % 60}s` : ""}`;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.handle} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(350)} style={styles.hero}>
          <StretchIcon
            mciIcon={stretch.mciIcon}
            size={56}
            color={cat.color}
            bgColor={cat.bgColor}
            boxSize={100}
            borderRadius={28}
          />

          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: cat.bgColor }]}>
              <Ionicons name={cat.icon as any} size={11} color={cat.color} />
              <Text style={[styles.badgeText, { color: cat.color }]}>{cat.label}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={11} color={Colors.textSecondary} />
              <Text style={styles.badgeText}>{dLabel}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: Colors.accentMuted }]}>
              <Text style={[styles.badgeText, { color: Colors.accent }]}>{stretch.difficulty}</Text>
            </View>
          </View>

          <Text style={styles.name}>{stretch.name}</Text>
          <Text style={styles.description}>{stretch.description}</Text>
        </Animated.View>

        {stretch.instructions.length > 0 && (
          <Animated.View entering={FadeInDown.duration(350).delay(80)} style={styles.section}>
            <Text style={styles.sectionLabel}>HOW TO DO IT</Text>
            <View style={styles.instrList}>
              {stretch.instructions.map((step, i) => (
                <View key={i} style={styles.instrRow}>
                  <View style={[styles.instrNum, { backgroundColor: cat.bgColor }]}>
                    <Text style={[styles.instrNumText, { color: cat.color }]}>{i + 1}</Text>
                  </View>
                  <Text style={styles.instrText}>{step}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(350).delay(140)} style={styles.section}>
          <Text style={styles.sectionLabel}>BREATHING CUE</Text>
          <View style={styles.cueBox}>
            <Ionicons name="water-outline" size={16} color={Colors.primary} />
            <Text style={styles.cueText}>{stretch.breathingCue}</Text>
          </View>
        </Animated.View>

        {stretch.tip && (
          <Animated.View entering={FadeInDown.duration(350).delay(200)} style={styles.section}>
            <View style={styles.tipBox}>
              <Ionicons name="bulb-outline" size={16} color={Colors.accent} />
              <Text style={styles.tipText}>{stretch.tip}</Text>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      <Animated.View entering={FadeInDown.duration(350).delay(250)} style={styles.footer}>
        <Pressable style={styles.startBtn} onPress={handleStart}>
          <Ionicons name="play-circle-outline" size={22} color={Colors.white} />
          <Text style={styles.startBtnText}>Start Stretch · {dLabel}</Text>
        </Pressable>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>Close</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgCard },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.divider, alignSelf: "center", marginTop: 10, marginBottom: 4,
  },
  hero: { padding: 24, alignItems: "flex-start" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 16, marginBottom: 14 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.bgSurface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  badgeText: { fontSize: 12, fontFamily: "DM_Sans_500Medium", color: Colors.textSecondary, textTransform: "capitalize" },
  name: {
    fontSize: 30, fontFamily: "DM_Sans_700Bold", color: Colors.text,
    letterSpacing: -0.4, marginBottom: 10, lineHeight: 36,
  },
  description: { fontSize: 16, fontFamily: "DM_Sans_400Regular", color: Colors.textSecondary, lineHeight: 24 },
  section: { paddingHorizontal: 24, marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, fontFamily: "DM_Sans_600SemiBold", color: Colors.textMuted,
    letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 12,
  },
  instrList: { gap: 10 },
  instrRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  instrNum: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  instrNumText: { fontSize: 13, fontFamily: "DM_Sans_700Bold" },
  instrText: { flex: 1, fontSize: 15, fontFamily: "DM_Sans_400Regular", color: Colors.text, lineHeight: 22, paddingTop: 2 },
  cueBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: Colors.primaryMuted, borderRadius: 12, padding: 14,
  },
  cueText: { flex: 1, fontSize: 14, fontFamily: "DM_Sans_400Regular", color: Colors.textSecondary, lineHeight: 21 },
  tipBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: Colors.accentMuted, borderRadius: 12, padding: 14,
  },
  tipText: { flex: 1, fontSize: 14, fontFamily: "DM_Sans_400Regular", color: Colors.textSecondary, lineHeight: 21 },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.bgCard, padding: 20,
    borderTopWidth: 1, borderTopColor: Colors.divider, gap: 10,
  },
  startBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", backgroundColor: Colors.primary,
    borderRadius: 16, paddingVertical: 16, gap: 10,
  },
  startBtnText: { fontSize: 17, fontFamily: "DM_Sans_700Bold", color: Colors.white },
  closeBtn: { alignItems: "center", paddingVertical: 8 },
  closeBtnText: { fontSize: 14, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },
  error: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  errorText: { fontSize: 18, fontFamily: "DM_Sans_500Medium", color: Colors.text },
  errorBack: { marginTop: 12 },
  errorBackText: { color: Colors.primary, fontFamily: "DM_Sans_500Medium", fontSize: 15 },
});
