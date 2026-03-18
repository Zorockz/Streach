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

// --- 7-Day bar chart ---
function WeekChart({ sessions }: { sessions: StretchSession[] }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const data = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const count = sessions.filter(s => s.completedAt.startsWith(key)).length;
    const isToday = i === 6;
    return { label: days[d.getDay()].slice(0, 1), count, isToday, key };
  });
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <View style={chart.row}>
      {data.map((d, i) => (
        <View key={i} style={chart.col}>
          {d.count > 0 && (
            <Text style={chart.count}>{d.count}</Text>
          )}
          <View style={chart.track}>
            <View
              style={[
                chart.fill,
                d.count > 0 && {
                  height: `${Math.max((d.count / max) * 100, 10)}%`,
                  backgroundColor: d.isToday ? Colors.accent : Colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[chart.label, d.isToday && chart.labelToday]}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

// --- 30-day calendar heatmap ---
function MonthHeatmap({ sessions }: { sessions: StretchSession[] }) {
  const today = new Date();
  const cells = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (34 - i));
    const key = d.toISOString().split("T")[0];
    const count = sessions.filter(s => s.completedAt.startsWith(key)).length;
    const isToday = i === 34;
    return { count, isToday };
  });

  return (
    <View style={heatmap.grid}>
      {cells.map((c, i) => (
        <View
          key={i}
          style={[
            heatmap.cell,
            c.count === 0 && heatmap.cellEmpty,
            c.count === 1 && heatmap.cellLow,
            c.count === 2 && heatmap.cellMid,
            c.count >= 3 && heatmap.cellHigh,
            c.isToday && heatmap.cellToday,
          ]}
        />
      ))}
    </View>
  );
}

const heatmap = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  cell: { width: 32, height: 32, borderRadius: 7 },
  cellEmpty: { backgroundColor: Colors.bgSurface },
  cellLow: { backgroundColor: "rgba(58, 122, 92, 0.3)" },
  cellMid: { backgroundColor: "rgba(58, 122, 92, 0.6)" },
  cellHigh: { backgroundColor: Colors.primary },
  cellToday: { borderWidth: 2, borderColor: Colors.accent },
});

const chart = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", height: 100, gap: 0 },
  col: { flex: 1, alignItems: "center", gap: 4 },
  count: { fontSize: 10, fontFamily: "DM_Sans_600SemiBold", color: Colors.primary },
  track: {
    width: 24, height: 72, backgroundColor: Colors.bgSurface,
    borderRadius: 8, justifyContent: "flex-end", overflow: "hidden",
  },
  fill: {
    width: "100%", backgroundColor: Colors.bgSurface,
    borderRadius: 8, height: "10%",
  },
  label: { fontSize: 10, fontFamily: "DM_Sans_500Medium", color: Colors.textMuted },
  labelToday: { color: Colors.accent, fontFamily: "DM_Sans_700Bold" },
});

// --- Session row ---
function SessionRow({ session }: { session: StretchSession }) {
  const d = new Date(session.completedAt);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString([], { month: "short", day: "numeric" });
  return (
    <View style={styles.sRow}>
      <View style={styles.sDot}>
        <Ionicons name="checkmark" size={13} color={Colors.primary} />
      </View>
      <View style={styles.sMeta}>
        <Text style={styles.sName}>{session.stretchName}</Text>
        {session.targetApp && (
          <Text style={styles.sApp}>Unlocked {session.targetApp}</Text>
        )}
      </View>
      <View style={styles.sTime}>
        <Text style={styles.sDate}>{date}</Text>
        <Text style={styles.sHour}>{time}</Text>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, todayCount, currentStreak, totalSessions } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const thisWeek = sessions.filter(
    s => new Date(s.completedAt) > new Date(Date.now() - 7 * 86400000)
  ).length;

  const totalMins = Math.round(
    sessions.reduce((a, s) => a + s.durationSeconds, 0) / 60
  );

  const longestStreak = (() => {
    if (!sessions.length) return 0;
    const days = [...new Set(sessions.map(s => s.completedAt.split("T")[0]))].sort();
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

        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.sub}>Your wellness journey</Text>
        </View>

        {/* Streak hero */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.streakHero}>
          <View style={styles.streakFlame}>
            <Ionicons name="flame" size={44} color={Colors.accent} />
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakNum}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakInfo}>
            <Text style={styles.streakNum}>{longestStreak}</Text>
            <Text style={styles.streakLabel}>best ever</Text>
          </View>
        </Animated.View>

        {/* This week chart */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)} style={styles.card}>
          <Text style={styles.cardTitle}>This Week</Text>
          <WeekChart sessions={sessions} />
          <View style={styles.weekSummary}>
            <View style={styles.weekStat}>
              <Text style={styles.weekVal}>{thisWeek}</Text>
              <Text style={styles.weekLabel}>stretches</Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={styles.weekVal}>{todayCount}</Text>
              <Text style={styles.weekLabel}>today</Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={styles.weekVal}>
                {thisWeek > 0 ? Math.round((thisWeek / 7) * 10) / 10 : 0}
              </Text>
              <Text style={styles.weekLabel}>per day avg</Text>
            </View>
          </View>
        </Animated.View>

        {/* 30-day heatmap */}
        <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.card}>
          <Text style={styles.cardTitle}>Last 35 Days</Text>
          <Text style={styles.cardSub}>Each cell is one day · darker = more stretches</Text>
          <MonthHeatmap sessions={sessions} />
        </Animated.View>

        {/* All-time stats */}
        <Animated.View entering={FadeInDown.duration(400).delay(180)} style={styles.card}>
          <Text style={styles.cardTitle}>All Time</Text>
          <View style={styles.allRow}>
            {[
              { icon: "checkmark-done-outline", val: totalSessions, label: "Stretches" },
              { icon: "time-outline", val: `${totalMins}m`, label: "Time moved" },
              { icon: "flame-outline", val: longestStreak, label: "Best streak" },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                <View style={styles.allStat}>
                  <Ionicons name={s.icon as any} size={18} color={Colors.primary} />
                  <Text style={styles.allVal}>{s.val}</Text>
                  <Text style={styles.allLabel}>{s.label}</Text>
                </View>
                {i < 2 && <View style={styles.vDiv} />}
              </React.Fragment>
            ))}
          </View>
        </Animated.View>

        {/* Session history */}
        <Animated.View entering={FadeInDown.duration(400).delay(240)} style={styles.card}>
          <Text style={styles.cardTitle}>Recent Sessions</Text>
          {sessions.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="body-outline" size={38} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptySub}>Complete your first stretch to see it here</Text>
            </View>
          ) : (
            <View>
              {sessions.slice(0, 25).map(s => (
                <SessionRow key={s.id} session={s} />
              ))}
            </View>
          )}
        </Animated.View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, marginBottom: 16 },
  title: { fontSize: 27, fontFamily: "DM_Sans_700Bold", color: Colors.text, letterSpacing: -0.4, marginBottom: 2 },
  sub: { fontSize: 13, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },
  streakHero: {
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: Colors.bgCard,
    borderRadius: 20, padding: 22,
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: Colors.divider,
    gap: 0,
  },
  streakFlame: { marginRight: 16 },
  streakInfo: { alignItems: "center", flex: 1 },
  streakNum: { fontSize: 40, fontFamily: "DM_Sans_700Bold", color: Colors.text, lineHeight: 44 },
  streakLabel: { fontSize: 12, fontFamily: "DM_Sans_500Medium", color: Colors.textMuted, marginTop: 2 },
  streakDivider: { width: 1, height: 44, backgroundColor: Colors.divider, marginHorizontal: 8 },
  card: {
    marginHorizontal: 20, backgroundColor: Colors.bgCard,
    borderRadius: 18, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.divider,
  },
  cardTitle: { fontSize: 14, fontFamily: "DM_Sans_700Bold", color: Colors.text, marginBottom: 4 },
  cardSub: { fontSize: 11, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted, marginBottom: 14 },
  weekSummary: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  weekStat: { alignItems: "center", flex: 1 },
  weekVal: { fontSize: 20, fontFamily: "DM_Sans_700Bold", color: Colors.text },
  weekLabel: { fontSize: 10, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.3 },
  allRow: { flexDirection: "row", justifyContent: "space-around", paddingTop: 10 },
  allStat: { alignItems: "center", gap: 6, flex: 1 },
  vDiv: { width: 1, backgroundColor: Colors.divider, alignSelf: "stretch" },
  allVal: { fontSize: 22, fontFamily: "DM_Sans_700Bold", color: Colors.text },
  allLabel: { fontSize: 10, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.3 },
  empty: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyTitle: { fontSize: 15, fontFamily: "DM_Sans_600SemiBold", color: Colors.textSecondary },
  emptySub: { fontSize: 13, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted, textAlign: "center" },
  sRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 10,
    gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  sDot: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: Colors.primaryMuted, alignItems: "center", justifyContent: "center",
  },
  sMeta: { flex: 1 },
  sName: { fontSize: 14, fontFamily: "DM_Sans_500Medium", color: Colors.text, marginBottom: 2 },
  sApp: { fontSize: 11, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },
  sTime: { alignItems: "flex-end" },
  sDate: { fontSize: 11, fontFamily: "DM_Sans_500Medium", color: Colors.textMuted },
  sHour: { fontSize: 11, fontFamily: "DM_Sans_400Regular", color: Colors.textMuted },
});
