import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { BodyArea, STRETCHES, Stretch } from '@/constants/stretches';
import { ReminderTime } from '@/services/notifications';

export type ScrollTime = 'morning' | 'midday' | 'evening' | 'night';

export interface StretchSession {
  id: string;
  stretchId: string;
  stretchName: string;
  completedAt: string;
  durationSeconds: number;
  targetApp?: string;
}

export interface UnlockRecord {
  appId: string;
  appName: string;
  unlockedAt: string;
  expiresAt: string;
  stretchId: string;
  sourceSessionId?: string;
}

export interface AppSettings {
  hasCompletedOnboarding: boolean;
  lockedApps: string[];
  focusBodyAreas: BodyArea[];
  preferredDuration: number;
  dailyGoal: number;
  hapticEnabled: boolean;
  reminderEnabled: boolean;
  unlockWindowMinutes: number;
  // Extended fields
  selectedScrollTimes: ScrollTime[];
  selectedReminderTimes: ReminderTime[];
  notificationPermissionStatus: 'undetermined' | 'granted' | 'denied';
  honorSystemMode: boolean;
  lastReminderSyncAt?: string;
}

interface AppContextValue {
  settings: AppSettings;
  sessions: StretchSession[];
  activeUnlocks: Record<string, UnlockRecord>;
  todayCount: number;
  currentStreak: number;
  totalSessions: number;
  isLoading: boolean;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  recordSession: (session: Omit<StretchSession, 'id' | 'completedAt'>) => Promise<void>;
  clearAllData: () => Promise<void>;
  // Unlock helpers
  isAppUnlocked: (appId: string) => boolean;
  getUnlockRemainingMs: (appId: string) => number;
  unlockAppForWindow: (appId: string, appName: string, stretchId: string, sourceSessionId?: string) => Promise<void>;
  cleanupExpiredUnlocks: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  hasCompletedOnboarding: false,
  lockedApps: [],
  focusBodyAreas: [],
  preferredDuration: 30,
  dailyGoal: 3,
  hapticEnabled: true,
  reminderEnabled: false,
  unlockWindowMinutes: 15,
  selectedScrollTimes: [],
  selectedReminderTimes: [],
  notificationPermissionStatus: 'undetermined',
  honorSystemMode: true,
};

const STORAGE_KEYS = {
  SETTINGS: '@stretchgate/settings',
  SESSIONS: '@stretchgate/sessions',
  UNLOCKS: '@stretchgate/unlocks',
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
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function removeExpiredUnlocks(
  unlocks: Record<string, UnlockRecord>
): Record<string, UnlockRecord> {
  const now = Date.now();
  const result: Record<string, UnlockRecord> = {};
  for (const [id, record] of Object.entries(unlocks)) {
    if (new Date(record.expiresAt).getTime() > now) {
      result[id] = record;
    }
  }
  return result;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<StretchSession[]>([]);
  const [activeUnlocks, setActiveUnlocks] = useState<Record<string, UnlockRecord>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsData, sessionsData, unlocksData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
          AsyncStorage.getItem(STORAGE_KEYS.UNLOCKS),
        ]);

        if (settingsData) {
          // Merge stored settings with defaults so new fields are always present
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsData) });
        }
        if (sessionsData) setSessions(JSON.parse(sessionsData));

        if (unlocksData) {
          const parsed: Record<string, UnlockRecord> = JSON.parse(unlocksData);
          // Remove expired unlocks immediately on load
          const cleaned = removeExpiredUnlocks(parsed);
          setActiveUnlocks(cleaned);
          if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
            await AsyncStorage.setItem(STORAGE_KEYS.UNLOCKS, JSON.stringify(cleaned));
          }
        }
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
      const newSettings = { ...prev, ...updates };
      AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

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
  }, []);

  const clearAllData = useCallback(async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.SESSIONS,
      STORAGE_KEYS.UNLOCKS,
    ]);
    setSettings(DEFAULT_SETTINGS);
    setSessions([]);
    setActiveUnlocks({});
  }, []);

  // ── Unlock helpers ────────────────────────────────────────────────

  const isAppUnlocked = useCallback(
    (appId: string): boolean => {
      const record = activeUnlocks[appId];
      if (!record) return false;
      return new Date(record.expiresAt).getTime() > Date.now();
    },
    [activeUnlocks]
  );

  const getUnlockRemainingMs = useCallback(
    (appId: string): number => {
      const record = activeUnlocks[appId];
      if (!record) return 0;
      return Math.max(0, new Date(record.expiresAt).getTime() - Date.now());
    },
    [activeUnlocks]
  );

  const unlockAppForWindow = useCallback(
    async (appId: string, appName: string, stretchId: string, sourceSessionId?: string) => {
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + settings.unlockWindowMinutes * 60 * 1000
      );
      const record: UnlockRecord = {
        appId,
        appName,
        unlockedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        stretchId,
        sourceSessionId,
      };
      setActiveUnlocks(prev => {
        const updated = { ...prev, [appId]: record };
        AsyncStorage.setItem(STORAGE_KEYS.UNLOCKS, JSON.stringify(updated));
        return updated;
      });
    },
    [settings.unlockWindowMinutes]
  );

  const cleanupExpiredUnlocks = useCallback(async () => {
    setActiveUnlocks(prev => {
      const cleaned = removeExpiredUnlocks(prev);
      if (Object.keys(cleaned).length !== Object.keys(prev).length) {
        AsyncStorage.setItem(STORAGE_KEYS.UNLOCKS, JSON.stringify(cleaned));
        return cleaned;
      }
      return prev;
    });
  }, []);

  const today = getTodayISO();
  const todayCount = sessions.filter(s => s.completedAt.startsWith(today)).length;
  const currentStreak = calculateStreak(sessions);
  const totalSessions = sessions.length;

  return (
    <AppContext.Provider value={{
      settings,
      sessions,
      activeUnlocks,
      todayCount,
      currentStreak,
      totalSessions,
      isLoading,
      updateSettings,
      recordSession,
      clearAllData,
      isAppUnlocked,
      getUnlockRemainingMs,
      unlockAppForWindow,
      cleanupExpiredUnlocks,
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
