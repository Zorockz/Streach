import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp, StretchSession } from "@/context/AppContext";

function WeekBar({ sessions }: { sessions: StretchSession[] }) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date();
  const data = days.map((day, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const count = sessions.filter((s) => s.completedAt.startsWith(key)).length;
    return { day, count, isToday: i === 6 };
  });
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <View style={bar.container}>
      {data.map(({ day, count, isToday }, i) => {
        const h = Math.max((count / max) * 72, count > 0 ? 8 : 3);
        return (
          <View key={i} style={bar.col}>
            <View style={bar.track}>
              <View
                style={[
                  bar.fill,
                  { height: h },
                  count > 0 && {
                    backgroundColor: isToday ? Colors.accent : Colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[bar.label, isToday && bar.labelToday]}>{day}</Text>
          </View>
        );
      })}
    </View>
  );
}

const bar = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 96,
    paddingBottom: 24,
  },
  col: { flex: 1, alignItems: "center", gap: 6 },
  track: {
    width: 24,
    height: 72,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  fill: {
    width: "100%",
    backgroundColor: "rgba(93,180,131,0.25)",
    borderRadius: 6,
  },
  label: {
    fontSize: 11,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textMuted,
  },
  labelToday: { color: Colors.accent },
});

function SessionRow({ session }: { session: StretchSession }) {
  const d = new Date(session.completedAt);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString([], { month: "short", day: "numeric" });
  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionDot}>
        <Ionicons name="checkmark" size={14} color={Colors.primary} />
      </View>
      <View style={styles.sessionMeta}>
        <Text style={styles.sessionName}>{session.stretchName}</Text>
        {session.targetApp && (
          <Text style={styles.sessionApp}>Unlocked {session.targetApp}</Text>
        )}
      </View>
      <View style={styles.sessionTime}>
        <Text style={styles.sessionDate}>{date}</Text>
        <Text style={styles.sessionHour}>{time}</Text>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, todayCount, currentStreak, totalSessions, settings } =
    useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const thisWeek = sessions.filter((s) => {
    return new Date(s.completedAt) > new Date(Date.now() - 7 * 86400000);
  }).length;

  const totalMinutes = Math.round(
    sessions.reduce((a, s) => a + s.durationSeconds, 0) / 60
  );

  const longestStreak = (() => {
    if (!sessions.length) return 0;
    const days = [...new Set(sessions.map((s) => s.completedAt.split("T")[0]))].sort();
    let max = 1, cur = 1;
    for (let i = 1; i < days.length; i++) {
      const diff = Math.round(
        (new Date(days[i]).getTime() - new Date(days[i - 1]).getTime()) / 86400000
      );
      cur = diff === 1 ? cur + 1 : 1;
      max = Math.max(max, cur);
    }
    return max;
  })();

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.header}>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.sub}>Your wellness journey</Text>
          </View>
        </Animated.View>

        {/* Week chart */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>This Week</Text>
            <WeekBar sessions={sessions} />
          </View>
        </Animated.View>

        {/* Big stats */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(120)}
          style={styles.bigRow}
        >
          <View style={[styles.bigCard, { backgroundColor: Colors.accentMuted }]}>
            <Ionicons name="flame" size={18} color={Colors.accent} />
            <Text style={[styles.bigNum, { color: Colors.accent }]}>
              {currentStreak}
            </Text>
            <Text style={styles.bigLabel}>Day streak</Text>
          </View>
          <View style={styles.miniCol}>
            <View style={[styles.miniCard, { marginBottom: 9 }]}>
              <Text style={styles.miniNum}>{longestStreak}</Text>
              <Text style={styles.miniLabel}>Best streak</Text>
            </View>
            <View style={styles.miniCard}>
              <Text style={styles.miniNum}>{thisWeek}</Text>
              <Text style={styles.miniLabel}>This week</Text>
            </View>
          </View>
        </Animated.View>

        {/* All time */}
        <Animated.View entering={FadeInDown.duration(400).delay(180)}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>All Time</Text>
            <View style={styles.allRow}>
              <View style={styles.allStat}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.allNum}>{totalSessions}</Text>
                <Text style={styles.allLabel}>Stretches</Text>
              </View>
              <View style={styles.vDivider} />
              <View style={styles.allStat}>
                <Ionicons name="time-outline" size={18} color={Colors.primary} />
                <Text style={styles.allNum}>{totalMinutes}</Text>
                <Text style={styles.allLabel}>Minutes</Text>
              </View>
              <View style={styles.vDivider} />
              <View style={styles.allStat}>
                <Ionicons
                  name="today-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.allNum}>{todayCount}</Text>
                <Text style={styles.allLabel}>Today</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Sessions */}
        <Animated.View entering={FadeInDown.duration(400).delay(240)}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Sessions</Text>
            {sessions.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="body-outline" size={36} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No sessions yet</Text>
                <Text style={styles.emptySub}>
                  Complete your first stretch to see it here
                </Text>
              </View>
            ) : (
              <View style={{ gap: 2 }}>
                {sessions.slice(0, 20).map((s) => (
                  <SessionRow key={s.id} session={s} />
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, marginBottom: 16 },
  title: {
    fontSize: 26,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  sub: { fontSize: 13, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },
  card: {
    marginHorizontal: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "DM_Sans_600SemiBold",
    color: Colors.text,
    marginBottom: 14,
  },
  bigRow: { flexDirection: "row", marginHorizontal: 20, gap: 10, marginBottom: 12 },
  bigCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
    alignItems: "flex-start",
    gap: 4,
  },
  bigNum: {
    fontSize: 44,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    lineHeight: 50,
  },
  bigLabel: {
    fontSize: 12,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textMuted,
  },
  miniCol: { flex: 1 },
  miniCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 14,
  },
  miniNum: {
    fontSize: 26,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
    marginBottom: 2,
  },
  miniLabel: {
    fontSize: 11,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textMuted,
  },
  allRow: { flexDirection: "row", justifyContent: "space-around" },
  allStat: { alignItems: "center", gap: 6, flex: 1 },
  vDivider: {
    width: 1,
    backgroundColor: Colors.divider,
    alignSelf: "stretch",
  },
  allNum: {
    fontSize: 22,
    fontFamily: "DM_Sans_700Bold",
    color: Colors.text,
  },
  allLabel: {
    fontSize: 11,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  empty: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyText: {
    fontSize: 15,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textSecondary,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  sessionDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionMeta: { flex: 1 },
  sessionName: {
    fontSize: 14,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.text,
    marginBottom: 2,
  },
  sessionApp: {
    fontSize: 11,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
  },
  sessionTime: { alignItems: "flex-end" },
  sessionDate: {
    fontSize: 11,
    fontFamily: "DM_Sans_500Medium",
    color: Colors.textMuted,
  },
  sessionHour: {
    fontSize: 11,
    fontFamily: "DM_Sans_400Regular",
    color: Colors.textMuted,
  },
});
