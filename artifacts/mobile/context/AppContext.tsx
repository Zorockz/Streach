import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BodyArea } from '@/constants/stretches';
import {
  ReminderTime,
  ReminderHourConfig,
  cancelAllUnlockExpiryAlerts,
  DEFAULT_REMINDER_HOURS,
  scheduleDailyReminder,
  scheduleStreakAlert,
  cancelAllNotifications,
  handleSessionCompleted,
} from '@/services/notifications';

export type ScrollTime = 'morning' | 'midday' | 'evening' | 'night';

export interface StretchSession {
  id: string;
  stretchId: string;
  stretchName: string;
  completedAt: string;
  durationSeconds: number;
  targetApp?: string;
}

export interface AppSettings {
  hasCompletedOnboarding: boolean;
  lockedApps: string[];
  focusBodyAreas: BodyArea[];
  preferredDuration: number;
  dailyGoal: number;
  hapticEnabled: boolean;
  reminderEnabled: boolean;
  selectedScrollTimes: ScrollTime[];
  selectedReminderTimes: ReminderTime[];
  reminderHours: Partial<Record<ReminderTime, ReminderHourConfig>>;
  notificationPermissionStatus: 'undetermined' | 'granted' | 'denied';
  streakNotifEnabled: boolean;
  streakNotifHour: number;
  gatesActive: boolean;
  familyControlsAuthorized: boolean;
  isLockActive: boolean;
  reminderTime: { hour: number; minute: number };
  sessionMinSeconds: number;
  lastReminderSyncAt?: string;
}

export interface AppContextValue {
  settings: AppSettings;
  sessions: StretchSession[];
  todayCount: number;
  currentStreak: number;
  totalSessions: number;
  isLoading: boolean;
  isStreakAtRisk: boolean;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  recordSession: (session: Omit<StretchSession, 'id' | 'completedAt'>) => Promise<void>;
  clearAllData: () => Promise<void>;
  onForeground: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  hasCompletedOnboarding: false,
  lockedApps: [],
  focusBodyAreas: [],
  preferredDuration: 30,
  dailyGoal: 3,
  hapticEnabled: true,
  reminderEnabled: false,
  selectedScrollTimes: [],
  selectedReminderTimes: [],
  reminderHours: {},
  notificationPermissionStatus: 'undetermined',
  streakNotifEnabled: true,
  streakNotifHour: 21,
  gatesActive: true,
  familyControlsAuthorized: false,
  isLockActive: false,
  reminderTime: { hour: 9, minute: 0 },
  sessionMinSeconds: 10,
};

const STORAGE_KEYS = {
  SETTINGS: '@stretchgate/settings',
  SESSIONS: '@stretchgate/sessions',
};

const AppContext = createContext<AppContextValue | null>(null);

function getLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTodayISO() {
  return getLocalDateStr();
}

function calculateStreak(sessions: StretchSession[]): number {
  if (sessions.length === 0) return 0;
  const daySet = new Set(sessions.map(s => s.completedAt.split('T')[0]));
  const days = Array.from(daySet).sort().reverse();
  const today = getTodayISO();
  const yesterday = getLocalDateStr(new Date(Date.now() - 86400000));
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) { streak++; } else { break; }
  }
  return streak;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<StretchSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsData, sessionsData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
        ]);

        if (settingsData) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsData) });
        }
        if (sessionsData) setSessions(JSON.parse(sessionsData));

        // Clean up any unlock expiry alerts left over from previous app versions
        await cancelAllUnlockExpiryAlerts();
      } catch (e) {
        console.error('Failed to load app data', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next));
      if ('reminderEnabled' in updates || 'reminderTime' in updates) {
        if (next.reminderEnabled) {
          const time = next.reminderTime ?? { hour: 9, minute: 0 };
          const streak = calculateStreak(sessions);
          scheduleDailyReminder(time, streak).catch(() => {});
          scheduleStreakAlert(streak).catch(() => {});
        } else {
          cancelAllNotifications().catch(() => {});
        }
      }
      return next;
    });
  }, [sessions]);

  const recordSession = useCallback(async (session: Omit<StretchSession, 'id' | 'completedAt'>) => {
    const now = new Date().toISOString();
    const oneMinAgo = new Date(Date.now() - 60000).toISOString();
    setSessions(prev => {
      const recentDupe = prev.find(
        s => s.stretchId === session.stretchId && s.completedAt > oneMinAgo
      );
      if (recentDupe) return prev;
      const newSession: StretchSession = {
        ...session,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        completedAt: now,
      };
      const newSessions = [newSession, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(newSessions));
      return newSessions;
    });
    try {
      const streak = calculateStreak(sessions);
      await handleSessionCompleted(streak);
    } catch (e) {
      console.warn('[SGNotif] reschedule failed:', e);
    }
  }, [sessions]);

  const clearAllData = useCallback(async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.SESSIONS,
    ]);
    setSettings(DEFAULT_SETTINGS);
    setSessions([]);
  }, []);

  const onForeground = useCallback(async () => {
    // Reserved for future foreground tasks (e.g. re-sync Screen Time schedule)
  }, []);

  const today = getTodayISO();
  const todayCount = sessions.filter(s => s.completedAt.startsWith(today)).length;
  const currentStreak = calculateStreak(sessions);
  const totalSessions = sessions.length;

  const isStreakAtRisk = useMemo(
    () => currentStreak > 0 && todayCount === 0 && new Date().getHours() >= 17,
    [currentStreak, todayCount]
  );

  return (
    <AppContext.Provider value={{
      settings,
      sessions,
      todayCount,
      currentStreak,
      totalSessions,
      isLoading,
      isStreakAtRisk,
      updateSettings,
      recordSession,
      clearAllData,
      onForeground,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
