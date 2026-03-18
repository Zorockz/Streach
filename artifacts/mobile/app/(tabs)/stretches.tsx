import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { BODY_AREAS, STRETCHES, BodyArea } from "@/constants/stretches";

const AREA_ICONS: Record<string, string> = {
  neck: "swap-vertical-outline",
  shoulders: "chevron-expand-outline",
  back: "body-outline",
  wrists: "hand-left-outline",
  hips: "walk-outline",
  full: "pulse-outline",
};

export default function StretchesScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<BodyArea | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const filtered = selected
    ? STRETCHES.filter(
        (s) => s.bodyArea.includes(selected) || s.bodyArea.includes("full")
      )
    : STRETCHES;

  const handleArea = async (id: BodyArea) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    setSelected(selected === id ? null : id);
  };

  const handleStretch = async (id: string) => {
    if (Platform.OS !== "web")
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/stretch/[id]", params: { id } });
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Stretch Library</Text>
        <Text style={styles.sub}>{filtered.length} stretches</Text>
      </View>

      {/* Area filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {BODY_AREAS.map((area) => (
          <Pressable
            key={area.id}
            style={[styles.pill, selected === area.id && styles.pillActive]}
            onPress={() => handleArea(area.id)}
          >
            <Ionicons
              name={AREA_ICONS[area.id] as any}
              size={13}
              color={
                selected === area.id ? Colors.textInverted : Colors.textSecondary
              }
            />
            <Text
              style={[
                styles.pillText,
                selected === area.id && styles.pillTextActive,
              ]}
            >
              {area.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {filtered.map((stretch, i) => (
          <Animated.View
            key={stretch.id}
            entering={FadeInDown.duration(350).delay(i * 40)}
          >
            <Pressable
              style={styles.card}
              onPress={() => handleStretch(stretch.id)}
            >
              <View style={styles.cardIcon}>
                <Ionicons
                  name={stretch.icon as any}
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{stretch.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={1}>
                  {stretch.description}
                </Text>
                <View style={styles.cardTags}>
                  {stretch.bodyArea.slice(0, 2).map((a) => (
                    <View key={a} style={styles.tag}>
                      <Text style={styles.tagText}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.duration}>{stretch.durationSeconds}s</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Colors.textMuted}
                />
              </View>
            </Pressable>
          </Animated.View>
        ))}
        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, marginBottom: 14 },
  title: {
    fontSize: 26,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  sub: { fontSize: 13, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },
  filterScroll: { marginBottom: 14 },
  filterRow: { paddingHorizontal: 20, gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillActive: { backgroundColor: Colors.primary },
  pillText: {
    fontSize: 13,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textSecondary,
  },
  pillTextActive: { color: Colors.textInverted },
  list: { paddingHorizontal: 20, gap: 10 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1 },
  cardName: {
    fontSize: 15,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.text,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
    lineHeight: 16,
    marginBottom: 7,
  },
  cardTags: { flexDirection: "row", gap: 5 },
  tag: {
    backgroundColor: "rgba(93,180,131,0.1)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.primaryLight,
    textTransform: "capitalize",
  },
  cardRight: { alignItems: "center", gap: 6 },
  duration: {
    fontSize: 13,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.textSecondary,
  },
});
