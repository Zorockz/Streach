import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  AppState,
  AppStateStatus,
  Linking,
  Platform,
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

function RootNavigator() {
  const { settings, isLoading, currentStreak, onForeground } = useApp();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Gates the home screen until Superwall resolves.
  // Starts false — the overlay is only rendered once the user IS onboarded
  // (see JSX below), so it never appears during the onboarding flow itself.
  const [paywallChecked, setPaywallChecked] = useState(false);
  const paywallTriggeredRef = useRef(false);

  // ── Onboarding redirect + Superwall gate (single effect) ───────────
  useEffect(() => {
    if (isLoading) return;

    if (!settings.hasCompletedOnboarding) {
      // Send to onboarding — no paywall overlay during this flow
      router.replace("/onboarding");
      return;
    }

    // User is onboarded — trigger Superwall exactly once.
    // Superwall calls feature() if the user is already subscribed,
    // or presents the paywall and calls onSkip/onDismiss otherwise.
    // Either way, onReady() is called → paywallChecked becomes true.
    if (paywallTriggeredRef.current) return;
    paywallTriggeredRef.current = true;

    initSuperwall().then(() => {
      triggerPaywall("Superwall Stretch APi", () => setPaywallChecked(true));
    });
  }, [isLoading, settings.hasCompletedOnboarding]);

  // ── Deep link handler ────────────────────────────────────────────────
  const handleDeepLink = (url: string) => {
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'stretch' && parsed.pathname.includes('session')) {
        const targetApp = parsed.searchParams.get('targetApp');
        const stretchId = parsed.searchParams.get('stretchId');
        const params: Record<string, string> = {};
        if (targetApp) params.targetApp = targetApp;
        if (stretchId) params.stretchId = stretchId;
        router.push({ pathname: '/stretch/session', params });
      }
    } catch {
      if (url.includes('stretch/session')) {
        const targetApp = url.split('targetApp=')[1]?.split('&')[0];
        const stretchId = url.split('stretchId=')[1]?.split('&')[0];
        const params: Record<string, string> = {};
        if (targetApp) params.targetApp = decodeURIComponent(targetApp);
        if (stretchId) params.stretchId = decodeURIComponent(stretchId);
        router.push({ pathname: '/stretch/session', params });
      }
    }
  };

  useEffect(() => {
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, []);

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

      {/* Paywall gate overlay — only rendered post-onboarding while Superwall
          is resolving. Superwall presents its paywall UI on top of this view.
          The loading indicator is shown beneath the paywall while it loads. */}
      {settings.hasCompletedOnboarding && !paywallChecked && (
        <View style={styles.paywallGate} pointerEvents="auto">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DM_Sans_400Regular: DMSans_400Regular,
    DM_Sans_500Medium: DMSans_500Medium,
    DM_Sans_600SemiBold: DMSans_600SemiBold,
    DM_Sans_700Bold: DMSans_700Bold,
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
            useNativeDriver: Platform.OS !== "web",
          }).start();
        });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <Animated.View style={{ flex: 1, opacity: appOpacity }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AppProvider>
              <RootNavigator />
            </AppProvider>
          </GestureHandlerRootView>
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
