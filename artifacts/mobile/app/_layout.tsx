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
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  AppState,
  AppStateStatus,
  StyleSheet,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "@/context/AppContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Colors } from "@/constants/colors";
import {
  configureNotificationHandler,
  syncStretchReminderNotifications,
} from "@/services/notifications";
import { initSuperwall, triggerPaywall } from "@/services/superwall";

SplashScreen.preventAutoHideAsync();

// Configure notification appearance once, before any component mounts
configureNotificationHandler();

const queryClient = new QueryClient();

function RootNavigator() {
  const { settings, isLoading, currentStreak, onForeground } = useApp();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Gates the home screen until Superwall resolves
  const [paywallChecked, setPaywallChecked] = useState(false);
  const paywallTriggeredRef = useRef(false);

  // ── Redirect to onboarding if needed ──────────────────────────────
  useEffect(() => {
    if (!isLoading && !settings.hasCompletedOnboarding) {
      router.replace("/onboarding");
      // No paywall during onboarding
      setPaywallChecked(true);
    }
  }, [isLoading]);

  // ── Trigger Superwall paywall when user is onboarded ───────────────
  useEffect(() => {
    if (isLoading) return;
    if (!settings.hasCompletedOnboarding) return;
    if (paywallTriggeredRef.current) return;
    paywallTriggeredRef.current = true;

    initSuperwall().then(() => {
      triggerPaywall("Superwall Stretch APi", () => setPaywallChecked(true));
    });
  }, [isLoading, settings.hasCompletedOnboarding]);

  // ── AppState listener: foreground/background ───────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener(
      "change",
      async (nextState: AppStateStatus) => {
        const prev = appStateRef.current;
        appStateRef.current = nextState;

        if (nextState === "active" && prev !== "active") {
          await onForeground();
        }
      }
    );
    return () => sub.remove();
  }, [onForeground]);

  // ── Sync notifications whenever key settings change ────────────────
  useEffect(() => {
    if (isLoading) return;
    syncStretchReminderNotifications({
      reminderEnabled: settings.reminderEnabled,
      selectedReminderTimes: settings.selectedReminderTimes,
      focusBodyAreas: settings.focusBodyAreas,
      notificationPermissionStatus: settings.notificationPermissionStatus,
      reminderHours: settings.reminderHours,
      streakNotifEnabled: settings.streakNotifEnabled,
      streakCount: currentStreak,
      streakNotifHour: settings.streakNotifHour,
    }).catch(() => {});
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
    <>
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

      {/* Paywall gate overlay — Superwall presents its UI on top of this */}
      {!paywallChecked && (
        <View style={styles.paywallGate} pointerEvents="auto">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DM_Sans_400Regular,
    DM_Sans_500Medium,
    DM_Sans_600SemiBold,
    DM_Sans_700Bold,
  });

  const appOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
        .catch(() => {})
        .finally(() => {
          Animated.timing(appOpacity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }).start();
        });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <Animated.View style={{ flex: 1, opacity: appOpacity }}>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  paywallGate: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
