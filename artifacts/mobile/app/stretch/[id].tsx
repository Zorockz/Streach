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
import { STRETCHES } from "@/constants/stretches";

export default function StretchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const stretch = STRETCHES.find((s) => s.id === id);

  if (!stretch) {
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
    if (Platform.OS !== "web")
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/stretch/session", params: { stretchId: stretch.id } });
  };

  const duration = stretch.durationSeconds;
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const durationStr =
    mins > 0 ? `${mins}m ${secs > 0 ? secs + "s" : ""}`.trim() : `${secs}s`;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
      {/* Dismiss handle */}
      <View style={styles.handle} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.hero}>
          <View style={styles.iconWrap}>
            <Ionicons name={stretch.icon as any} size={56} color={Colors.primary} />
          </View>
          <View style={styles.heroBadges}>
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.badgeText}>{durationStr}</Text>
            </View>
            {stretch.bodyArea.map((a) => (
              <View key={a} style={[styles.badge, styles.badgeArea]}>
                <Text style={styles.badgeText}>{a}</Text>
              </View>
            ))}
            {stretch.difficulty && (
              <View style={[styles.badge, styles.badgeDiff]}>
                <Text style={[styles.badgeText, { color: Colors.accent }]}>
                  {stretch.difficulty}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{stretch.name}</Text>
          <Text style={styles.description}>{stretch.description}</Text>
        </Animated.View>

        {/* Instructions */}
        {stretch.instructions && stretch.instructions.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
            <Text style={styles.sectionTitle}>How to do it</Text>
            <View style={styles.instrList}>
              {stretch.instructions.map((step, i) => (
                <View key={i} style={styles.instrRow}>
                  <View style={styles.instrNum}>
                    <Text style={styles.instrNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.instrText}>{step}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Tips */}
        {stretch.tip && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={16} color={Colors.accent} />
            <Text style={styles.tipText}>{stretch.tip}</Text>
          </Animated.View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Sticky CTA */}
      <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.footer}>
        <Pressable style={styles.startBtn} onPress={handleStart}>
          <Ionicons name="play-circle-outline" size={22} color={Colors.textInverted} />
          <Text style={styles.startBtnText}>Start Stretch · {durationStr}</Text>
        </Pressable>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>Close</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgSurface },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  hero: { padding: 24, alignItems: "flex-start" },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroBadges: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeArea: { backgroundColor: Colors.primaryMuted },
  badgeDiff: { backgroundColor: Colors.accentMuted },
  badgeText: {
    fontSize: 12,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  name: {
    fontSize: 30,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    letterSpacing: -0.4,
    marginBottom: 10,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  section: { paddingHorizontal: 24, marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.textMuted,
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  instrList: { gap: 12 },
  instrRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  instrNum: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  instrNumText: {
    fontSize: 13,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.primary,
  },
  instrText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.text,
    lineHeight: 22,
    paddingTop: 2,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 24,
    backgroundColor: Colors.accentMuted,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bgSurface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: 10,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
  },
  startBtnText: {
    fontSize: 17,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.textInverted,
  },
  closeBtn: { alignItems: "center", paddingVertical: 8 },
  closeBtnText: {
    fontSize: 14,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
  },
  error: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  errorText: { fontSize: 18, fontFamily: "DM_Sans_500Medium", color: Colors.text },
  errorBack: { marginTop: 12 },
  errorBackText: { color: Colors.primary, fontFamily: "DM_Sans_500Medium", fontSize: 15 },
});
