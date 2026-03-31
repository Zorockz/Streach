import {
  DM_Sans_400Regular,
  DM_Sans_500Medium,
  DM_Sans_600SemiBold,
  DM_Sans_700Bold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "@/context/AppContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Colors } from "@/constants/colors";
import {
  configureNotificationHandler,
  syncStretchReminderNotifications,
} from "@/services/notifications";

SplashScreen.preventAutoHideAsync();

// Configure notification appearance once, before any component mounts
configureNotificationHandler();

const queryClient = new QueryClient();

function RootNavigator() {
  const { settings, sessions, isLoading, currentStreak, todayCount, onForeground } = useApp();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // ── Redirect to onboarding if needed ──────────────────────────────
  useEffect(() => {
    if (!isLoading && !settings.hasCompletedOnboarding) {
      router.replace("/onboarding");
    }
  }, [isLoading]);

  // ── AppState listener: foreground/background ───────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active' && prev !== 'active') {
        // App came to foreground — clean up stale unlocks
        await onForeground();
      }
    });
    return () => sub.remove();
  }, [onForeground]);

  // ── Sync notifications whenever key settings change ────────────────
  useEffect(() => {
    if (isLoading) return;
    // Fire-and-forget: sync reminders + streak notif based on current state
    syncStretchReminderNotifications({
      reminderEnabled: settings.reminderEnabled,
      selectedReminderTimes: settings.selectedReminderTimes,
      focusBodyAreas: settings.focusBodyAreas,
      notificationPermissionStatus: settings.notificationPermissionStatus,
      reminderHours: settings.reminderHours,
      streakNotifEnabled: settings.streakNotifEnabled,
      streakCount: currentStreak,
      streakNotifHour: settings.streakNotifHour,
    }).catch(() => { /* non-fatal */ });
  }, [
    isLoading,
    settings.reminderEnabled,
    settings.selectedReminderTimes,
    settings.focusBodyAreas,
    settings.notificationPermissionStatus,
    settings.streakNotifEnabled,
    settings.streakNotifHour,
    currentStreak,
  ]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: "fade",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="stretch/[id]"
        options={{
          headerShown: false,
          animation: "slide_from_bottom",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="stretch/session"
        options={{
          headerShown: false,
          animation: "fade",
          presentation: "fullScreenModal",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DM_Sans_400Regular,
    DM_Sans_500Medium,
    DM_Sans_600SemiBold,
    DM_Sans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AppProvider>
              <RootNavigator />
            </AppProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
