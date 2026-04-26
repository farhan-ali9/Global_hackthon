import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import * as Notifications from "expo-notifications";
import { useRouter, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "@/src/context-engine/registerLocalMerchantModelClient";
import { UserContextLoopProvider } from "@/src/context-engine/UserContextLoopProvider";
import {
  configureNotificationHandler,
  createNotificationChannel,
  registerForPushNotifications,
} from "@/src/services/notifications";

// Configure foreground display behaviour before any component mounts
configureNotificationHandler();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Create Android channel + request permission on first mount
    void createNotificationChannel();
    void registerForPushNotifications().then((result) => {
      if (result.granted) {
        if (result.token) {
          console.log("[Notifications] Push token:", result.token);
        } else {
          console.log("[Notifications] Permission granted — local notifications active. Remote push requires a dev build.");
        }
      } else {
        console.log("[Notifications] Not registered:", result.reason);
      }
    });

    // Received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[Notifications] Received:", notification.request.content.title);
      },
    );

    // User tapped the notification → navigate to Coupons tab
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        if (data?.type === "new_coupon" || data?.type === "digest") {
          router.push("/(tabs)/coupons");
        }
      },
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <UserContextLoopProvider>
        <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="scan"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen name="personal-information" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="coupon/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="map/index" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="offers/[id]" />
          <Stack.Screen name="redeem/[id]" />
          <Stack.Screen name="merchant/dashboard" />
          <Stack.Screen name="merchant/rules" />
        </Stack>
      </UserContextLoopProvider>
    </SafeAreaProvider>
  );
}
