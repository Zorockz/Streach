import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { BodyArea, STRETCHES, Stretch } from '@/constants/stretches';

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
}

interface AppContextValue {
  settings: AppSettings;
  sessions: StretchSession[];
  todayCount: number;
  currentStreak: number;
  totalSessions: number;
  isLoading: boolean;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  recordSession: (session: Omit<StretchSession, 'id' | 'completedAt'>) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  hasCompletedOnboarding: false,
  lockedApps: [],
  focusBodyAreas: [],
  preferredDuration: 30,
  dailyGoal: 3,
  hapticEnabled: true,
  reminderEnabled: false,
};

const STORAGE_KEYS = {
  SETTINGS: '@stretchgate/settings',
  SESSIONS: '@stretchgate/sessions',
};

const AppContext = createContext<AppContextValue | null>(null);

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function calculateStreak(sessions: StretchSession[]): number {
  if (sessions.length === 0) return 0;

  const daySet = new Set(sessions.map(s => s.completedAt.split('T')[0]));
  const days = Array.from(daySet).sort().reverse();

  const today = getTodayISO();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

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
        if (settingsData) setSettings(JSON.parse(settingsData));
        if (sessionsData) setSessions(JSON.parse(sessionsData));
      } catch (e) {
        console.error('Failed to load app data', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  }, [settings]);

  const recordSession = useCallback(async (session: Omit<StretchSession, 'id' | 'completedAt'>) => {
    const newSession: StretchSession = {
      ...session,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      completedAt: new Date().toISOString(),
    };
    const newSessions = [newSession, ...sessions];
    setSessions(newSessions);
    await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(newSessions));
  }, [sessions]);

  const clearAllData = useCallback(async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.SETTINGS, STORAGE_KEYS.SESSIONS]);
    setSettings(DEFAULT_SETTINGS);
    setSessions([]);
  }, []);

  const today = getTodayISO();
  const todayCount = sessions.filter(s => s.completedAt.startsWith(today)).length;
  const currentStreak = calculateStreak(sessions);
  const totalSessions = sessions.length;

  return (
    <AppContext.Provider value={{
      settings,
      sessions,
      todayCount,
      currentStreak,
      totalSessions,
      isLoading,
      updateSettings,
      recordSession,
      clearAllData,
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
