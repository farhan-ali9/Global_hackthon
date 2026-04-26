/**
 * City Wallet — Push Notification Service
 *
 * Responsibilities:
 *  1. Create the Android notification channel on app start.
 *  2. Ask the user for permission and obtain an Expo Push Token.
 *  3. Schedule / send local "new coupon" notifications for demo purposes.
 *  4. Export helpers used by the root layout and Profile screen.
 *
 * Real push flow:
 *   Device registers  →  token sent to your backend  →  backend calls
 *   https://exp.host/--/api/v2/push/send  →  notification arrives.
 *
 * For this demo we drive everything with local notifications so no
 * server setup is required.
 */

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { MAP_MERCHANTS } from "@/src/data/mockData";

/* ─────────────────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────────────────── */

export const CHANNEL_ID = "city-wallet-coupons";

/* ─────────────────────────────────────────────────────────────────
   Android channel
   ───────────────────────────────────────────────────────────────── */

export async function createNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "New Coupons",
    description: "Alerts when new discount coupons are available nearby",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 150, 200],
    lightColor: "#2d6a4f",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
    enableLights: true,
    enableVibrate: true,
    showBadge: true,
  });
}

/* ─────────────────────────────────────────────────────────────────
   Permission + token
   ───────────────────────────────────────────────────────────────── */

export type PermissionResult =
  | { granted: true;  token: string | null }
  | { granted: false; reason: string };

/**
 * Requests notification permission and tries to obtain an Expo Push Token.
 *
 * - Permission granted  → local notifications work (Expo Go + dev build).
 * - Token obtained      → remote push also works (dev build / standalone only;
 *                         Expo Go strips remote push since SDK 53).
 * - Token fetch fails   → still returns granted:true so local notifications
 *                         (test button, digest) function normally.
 */
export async function registerForPushNotifications(): Promise<PermissionResult> {
  // Channel must exist before requesting permission on Android
  await createNotificationChannel();

  if (!Device.isDevice) {
    return { granted: false, reason: "Push notifications require a physical device." };
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return { granted: false, reason: "Permission denied by the user." };
  }

  // Try to get the remote push token — failure is non-fatal in Expo Go.
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    return { granted: true, token };
  } catch {
    // No projectId / Expo Go environment — local notifications still work.
    return { granted: true, token: null };
  }
}

/* ─────────────────────────────────────────────────────────────────
   Global notification behaviour (call once in root layout)
   ───────────────────────────────────────────────────────────────── */

/**
 * Configures how notifications are displayed while the app is
 * in the foreground.  Call this at module level (outside components).
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/* ─────────────────────────────────────────────────────────────────
   Demo / local notifications
   ───────────────────────────────────────────────────────────────── */

/**
 * Fires an immediate local notification that looks like a real
 * "new coupon" push.  Safe to call from a button press in the UI.
 */
export async function sendDemoCouponNotification(): Promise<void> {
  const merchant = MAP_MERCHANTS[Math.floor(Math.random() * MAP_MERCHANTS.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `New offer candidate from ${merchant.name}`,
      body: `${merchant.offer} available once generation is enabled.`,
      data: { type: "new_coupon", company: merchant.name },
      // Android-specific overrides
      ...(Platform.OS === "android" && {
        color: "#2d6a4f",
        priority: "high",
        vibrate: [0, 200, 150, 200],
      }),
    },
    trigger: null, // null = deliver immediately
  });
}

/**
 * Schedules a "new coupons nearby" digest notification N seconds from now.
 * Useful to simulate a background push arriving later.
 */
export async function scheduleCouponDigest(delaySeconds = 10): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🏷️ New coupons nearby",
      body: "5 new offers are available within 500 m of you",
      data: { type: "digest" },
      ...(Platform.OS === "android" && {
        color: "#2d6a4f",
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
    },
  });
}

/** Cancel all pending scheduled notifications */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
