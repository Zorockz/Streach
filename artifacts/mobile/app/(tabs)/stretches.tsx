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
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { StretchIcon } from "@/components/StretchIcon";
import {
  STRETCH_CATEGORIES,
  getStretchesByCategory,
  Stretch,
  StretchCategory,
  BodyArea,
} from "@/constants/stretches";

function CategoryPill({ cat, selected, onPress }: {
  cat: StretchCategory; selected: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.pill, selected && { backgroundColor: cat.color }]}
      onPress={onPress}
    >
      <Ionicons name={cat.icon as any} size={13} color={selected ? "#fff" : Colors.textSecondary} />
      <Text style={[styles.pillText, selected && styles.pillTextOn]}>
        {cat.label.split(" ")[0]}
      </Text>
    </Pressable>
  );
}

function StretchCard({ stretch, cat, onPress }: {
  stretch: Stretch; cat: StretchCategory; onPress: () => void;
}) {
  const d = stretch.durationSeconds;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <StretchIcon
        mciIcon={stretch.mciIcon}
        size={24}
        color={cat.color}
        bgColor={cat.bgColor}
        boxSize={50}
        borderRadius={14}
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{stretch.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={1}>{stretch.description}</Text>
        <View style={styles.cardMeta}>
          <View style={[styles.tag, { backgroundColor: cat.bgColor }]}>
            <Text style={[styles.tagText, { color: cat.color }]}>{d}s</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{stretch.difficulty}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

export default function StretchesScreen() {
  const [selected, setSelected] = useState<BodyArea | null>(null);

  const handleArea = async (id: BodyArea) => {
    if (Platform.OS !== "web") await Haptics.selectionAsync();
    setSelected(selected === id ? null : id);
  };

  const handleStretch = async (id: string) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/stretch/[id]", params: { id } });
  };

  const groups = getStretchesByCategory();
  const filteredGroups = selected ? groups.filter(g => g.category.id === selected) : groups;
  const totalCount = filteredGroups.reduce((acc, g) => acc + g.stretches.length, 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Stretches</Text>
        <Text style={styles.sub}>
          {totalCount} stretch{totalCount !== 1 ? "es" : ""}
          {selected
            ? ` in ${STRETCH_CATEGORIES.find(c => c.id === selected)?.label}`
            : " across 6 categories"}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={styles.filterScroll}>
        {STRETCH_CATEGORIES.map(cat => (
          <CategoryPill key={cat.id} cat={cat} selected={selected === cat.id} onPress={() => handleArea(cat.id)} />
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {filteredGroups.map((group, gi) => (
          <Animated.View key={group.category.id} entering={FadeInDown.duration(350).delay(gi * 60)}>
            <View style={styles.groupHeader}>
              <StretchIcon
                mciIcon={group.category.mciIcon}
                size={22}
                color={group.category.color}
                bgColor={group.category.bgColor}
                boxSize={50}
                borderRadius={14}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.groupTitle}>{group.category.label}</Text>
                <Text style={styles.groupSub}>{group.category.description}</Text>
              </View>
              <View style={[styles.groupCount, { backgroundColor: group.category.bgColor }]}>
                <Text style={[styles.groupCountText, { color: group.category.color }]}>
                  {group.stretches.length}
                </Text>
              </View>
            </View>

            <View style={styles.groupCards}>
              {group.stretches.map((stretch, si) => (
                <Animated.View key={stretch.id} entering={FadeInDown.duration(300).delay(gi * 60 + si * 40)}>
                  <StretchCard stretch={stretch} cat={group.category} onPress={() => handleStretch(stretch.id)} />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        ))}
        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, marginBottom: 14 },
  title: { fontSize: 27, fontFamily: "DM_Sans_700Bold", color: Colors.text, letterSpacing: -0.4, marginBottom: 2 },
  sub: { fontSize: 13, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },
  filterScroll: { marginBottom: 10 },
  filterRow: { paddingHorizontal: 20, gap: 8 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.bgCard, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.divider,
  },
  pillText: { fontSize: 13, fontFamily: "DM_Sans_500Medium", color: Colors.textSecondary },
  pillTextOn: { color: "#fff" },
  list: { paddingHorizontal: 20 },
  groupHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginTop: 22, marginBottom: 10,
  },
  groupTitle: { fontSize: 15, fontFamily: "DM_Sans_700Bold", color: Colors.text, marginBottom: 1 },
  groupSub: { fontSize: 11, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },
  groupCount: {
    marginLeft: "auto", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  groupCountText: { fontSize: 13, fontFamily: "DM_Sans_700Bold" },
  groupCards: { gap: 8 },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: Colors.divider,
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontFamily: "DM_Sans_600SemiBold", color: Colors.text, marginBottom: 3 },
  cardDesc: { fontSize: 12, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted, lineHeight: 16, marginBottom: 7 },
  cardMeta: { flexDirection: "row", gap: 5 },
  tag: {
    backgroundColor: Colors.bgSurface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  tagText: { fontSize: 10, fontFamily: "DM_Sans_500Medium", color: Colors.textSecondary, textTransform: "capitalize" },
});
