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

function WeekChart({ sessions }: { sessions: StretchSession[] }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const weekData = days.map((day, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const count = sessions.filter(s => s.completedAt.startsWith(dateStr)).length;
    const isToday = i === 6;
    return { day, count, isToday };
  });

  const maxCount = Math.max(...weekData.map(d => d.count), 1);

  return (
    <View style={styles.weekChart}>
      {weekData.map(({ day, count, isToday }, i) => {
        const height = Math.max((count / maxCount) * 80, 4);
        return (
          <View key={i} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { height },
                  count > 0 && { backgroundColor: isToday ? Colors.accentWarm : Colors.primaryLight },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>{day}</Text>
            <Text style={styles.barCount}>{count > 0 ? count : ''}</Text>
          </View>
        );
      })}
    </View>
  );
}

function SessionItem({ session }: { session: StretchSession }) {
  const date = new Date(session.completedAt);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <View style={styles.sessionItem}>
      <View style={styles.sessionIcon}>
        <Ionicons name="checkmark-circle" size={22} color={Colors.primaryLight} />
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionName}>{session.stretchName}</Text>
        {session.targetApp && (
          <Text style={styles.sessionApp}>Unlocked {session.targetApp}</Text>
        )}
      </View>
      <View style={styles.sessionTime}>
        <Text style={styles.sessionDate}>{dateStr}</Text>
        <Text style={styles.sessionHour}>{time}</Text>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, todayCount, currentStreak, totalSessions, settings } = useApp();

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : 0;

  const thisWeek = sessions.filter(s => {
    const sessionDate = new Date(s.completedAt);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    return sessionDate > weekAgo;
  }).length;

  const longestStreak = (() => {
    if (sessions.length === 0) return 0;
    const daySet = new Set(sessions.map(s => s.completedAt.split('T')[0]));
    const sorted = Array.from(daySet).sort();
    let max = 1, current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diff === 1) { current++; max = Math.max(max, current); }
      else current = 1;
    }
    return max;
  })();

  return (
    <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={styles.header}>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.subtitle}>Your wellness journey</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <WeekChart sessions={sessions} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <View style={styles.statsGrid}>
            <View style={styles.bigStat}>
              <Text style={styles.bigStatNum}>{currentStreak}</Text>
              <Text style={styles.bigStatLabel}>Current Streak</Text>
              <Ionicons name="flame" size={20} color={Colors.accentWarm} style={styles.bigStatIcon} />
            </View>
            <View style={styles.statsCol}>
              <View style={[styles.miniStat, { marginBottom: 8 }]}>
                <Text style={styles.miniStatNum}>{longestStreak}</Text>
                <Text style={styles.miniStatLabel}>Best streak</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatNum}>{thisWeek}</Text>
                <Text style={styles.miniStatLabel}>This week</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All-Time Stats</Text>
            <View style={styles.allTimeRow}>
              <View style={styles.allTimeStat}>
                <Ionicons name="checkmark-done-outline" size={20} color={Colors.primaryLight} />
                <Text style={styles.allTimeNum}>{totalSessions}</Text>
                <Text style={styles.allTimeLabel}>Stretches</Text>
              </View>
              <View style={styles.allTimeDivider} />
              <View style={styles.allTimeStat}>
                <Ionicons name="time-outline" size={20} color={Colors.primaryLight} />
                <Text style={styles.allTimeNum}>
                  {Math.round(sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60)}
                </Text>
                <Text style={styles.allTimeLabel}>Minutes</Text>
              </View>
              <View style={styles.allTimeDivider} />
              <View style={styles.allTimeStat}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primaryLight} />
                <Text style={styles.allTimeNum}>{todayCount}</Text>
                <Text style={styles.allTimeLabel}>Today</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(400)}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {sessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="body-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No stretches yet</Text>
                <Text style={styles.emptySubtext}>Complete your first stretch to see it here</Text>
              </View>
            ) : (
              <View style={styles.sessionList}>
                {sessions.slice(0, 15).map(session => (
                  <SessionItem key={session.id} session={session} />
                ))}
              </View>
            )}
          </View>
        </Animated.View>
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 20 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 2 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  section: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 14,
  },
  weekChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: {
    width: 28,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: 'rgba(122, 184, 147, 0.3)',
    borderRadius: 8,
  },
  barLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  barLabelToday: { color: Colors.accentWarm },
  barCount: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted, minHeight: 14 },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  bigStat: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    position: 'relative',
  },
  bigStatNum: { fontSize: 48, fontFamily: 'Inter_700Bold', color: Colors.text },
  bigStatLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginTop: 2 },
  bigStatIcon: { position: 'absolute', top: 16, right: 16 },
  statsCol: { flex: 1, gap: 8 },
  miniStat: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
  },
  miniStatNum: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.text },
  miniStatLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  allTimeRow: { flexDirection: 'row', justifyContent: 'space-around' },
  allTimeStat: { alignItems: 'center', gap: 6 },
  allTimeDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' },
  allTimeNum: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text },
  allTimeLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center' },
  sessionList: { gap: 2 },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sessionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(122,184,147,0.12)', alignItems: 'center', justifyContent: 'center' },
  sessionInfo: { flex: 1 },
  sessionName: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text, marginBottom: 2 },
  sessionApp: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  sessionTime: { alignItems: 'flex-end' },
  sessionDate: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  sessionHour: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
});
