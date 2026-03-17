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
import { useApp } from "@/context/AppContext";

function AreaPill({ area, active, onPress }: {
  area: typeof BODY_AREAS[0];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.areaPill, active && styles.areaPillActive]}
      onPress={onPress}
    >
      <Ionicons
        name={area.icon as any}
        size={14}
        color={active ? Colors.primaryDeep : Colors.textSecondary}
      />
      <Text style={[styles.areaPillText, active && styles.areaPillTextActive]}>
        {area.label}
      </Text>
    </Pressable>
  );
}

function StretchCard({ stretch, onPress }: {
  stretch: typeof STRETCHES[0];
  onPress: () => void;
}) {
  const durationLabel = stretch.durationSeconds < 60
    ? `${stretch.durationSeconds}s`
    : `${Math.floor(stretch.durationSeconds / 60)}m`;

  return (
    <Pressable style={styles.stretchCard} onPress={onPress}>
      <View style={styles.stretchIconBox}>
        <Ionicons name={stretch.icon as any} size={26} color={Colors.primaryLight} />
      </View>
      <View style={styles.stretchInfo}>
        <Text style={styles.stretchName}>{stretch.name}</Text>
        <Text style={styles.stretchDesc} numberOfLines={2}>{stretch.description}</Text>
        <View style={styles.stretchMeta}>
          {stretch.bodyArea.map(a => (
            <View key={a} style={styles.bodyTag}>
              <Text style={styles.bodyTagText}>{a}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.stretchDuration}>
        <Text style={styles.durationText}>{durationLabel}</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

export default function StretchesScreen() {
  const insets = useSafeAreaInsets();
  const { settings } = useApp();
  const [selectedArea, setSelectedArea] = useState<BodyArea | null>(null);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : 0;

  const filteredStretches = selectedArea
    ? STRETCHES.filter(s => s.bodyArea.includes(selectedArea) || s.bodyArea.includes('full'))
    : STRETCHES;

  const handleAreaPress = async (areaId: BodyArea) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    setSelectedArea(selectedArea === areaId ? null : areaId);
  };

  const handleStretchPress = async (stretchId: string) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/stretch/[id]', params: { id: stretchId } });
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Stretch Library</Text>
        <Text style={styles.subtitle}>{STRETCHES.length} stretches ready</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.areasRow}
        style={styles.areasScroll}
      >
        {BODY_AREAS.map(area => (
          <AreaPill
            key={area.id}
            area={area}
            active={selectedArea === area.id}
            onPress={() => handleAreaPress(area.id)}
          />
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredStretches.map((stretch, i) => (
          <Animated.View
            key={stretch.id}
            entering={FadeInDown.duration(400).delay(i * 50)}
          >
            <StretchCard
              stretch={stretch}
              onPress={() => handleStretchPress(stretch.id)}
            />
          </Animated.View>
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  areasScroll: {
    marginBottom: 16,
  },
  areasRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  areaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  areaPillActive: {
    backgroundColor: Colors.softMint,
    borderColor: Colors.primaryLight,
  },
  areaPillText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  areaPillTextActive: {
    color: Colors.primaryDeep,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  stretchCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stretchIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(122, 184, 147, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stretchInfo: {
    flex: 1,
  },
  stretchName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 3,
  },
  stretchDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    lineHeight: 17,
    marginBottom: 8,
  },
  stretchMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  bodyTag: {
    backgroundColor: 'rgba(122, 184, 147, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bodyTagText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: Colors.primaryLight,
    textTransform: 'capitalize',
  },
  stretchDuration: {
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
});
