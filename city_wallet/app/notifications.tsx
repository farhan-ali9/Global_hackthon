import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  cancelAllNotifications,
  registerForPushNotifications,
  scheduleCouponDigest,
  sendDemoCouponNotification,
} from "@/src/services/notifications";
import { CW, fontFamily } from "@/src/theme/tokens";

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [tokenText,    setTokenText]    = useState<string | null>(null);
  const [registering,  setRegistering]  = useState(false);
  const [sending,      setSending]      = useState(false);

  useEffect(() => {
    void registerForPushNotifications().then((r) => {
      if (r.granted) {
        setNotifEnabled(true);
        setTokenText(r.token ?? null);
      }
    });
  }, []);

  async function handleNotifToggle(value: boolean) {
    if (value) {
      setRegistering(true);
      const result = await registerForPushNotifications();
      setRegistering(false);
      if (result.granted) {
        setNotifEnabled(true);
        setTokenText(result.token ?? null);
      } else {
        Alert.alert(
          "Permission required",
          result.reason + "\n\nOpen Settings → Notifications to enable them.",
        );
      }
    } else {
      await cancelAllNotifications();
      setNotifEnabled(false);
      setTokenText(null);
    }
  }

  async function handleScheduleDigest() {
    if (!notifEnabled) {
      Alert.alert("Enable notifications first", "Toggle notifications on above.");
      return;
    }
    await scheduleCouponDigest(10);
    Alert.alert("Scheduled", "A digest notification will arrive in ~10 seconds.\nBackground the app to see it.");
  }

  async function handleTestNotification() {
    if (!notifEnabled) {
      Alert.alert("Enable notifications first", "Toggle notifications on above.");
      return;
    }
    setSending(true);
    await sendDemoCouponNotification();
    setSending(false);
    Alert.alert("Sent!", "A demo coupon notification was delivered.");
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={CW.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Alerts</Text>
          <View style={styles.settingsList}>

            {/* Coupon Alerts toggle */}
            <View style={[styles.row, styles.rowBorder]}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBubble, { backgroundColor: "#e8f5ee" }]}>
                  <Ionicons name="notifications" size={16} color="#2d6a4f" />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Coupon Alerts</Text>
                  <Text style={styles.rowMeta}>
                    {notifEnabled ? "Notifications are on" : "Tap to enable"}
                  </Text>
                </View>
              </View>
              {registering
                ? <ActivityIndicator size="small" color={CW.soft} />
                : (
                  <Switch
                    value={notifEnabled}
                    onValueChange={handleNotifToggle}
                    trackColor={{ false: CW.border, true: "#2d6a4f" }}
                    thumbColor="#fff"
                  />
                )}
            </View>

            {/* Nearby Digest */}
            <Pressable
              style={({ pressed }) => [styles.row, styles.rowBorder, pressed && styles.pressed]}
              onPress={handleScheduleDigest}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBubble, { backgroundColor: "#eef3ff" }]}>
                  <Ionicons name="time" size={16} color="#3355cc" />
                </View>
                <View>
                  <Text style={styles.rowTitle}>Nearby Digest</Text>
                  <Text style={styles.rowMeta}>Schedule a digest in 10 s</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {/* Send Test Notification */}
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              onPress={handleTestNotification}
              disabled={sending}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBubble, { backgroundColor: "#fff5e6" }]}>
                  {sending
                    ? <ActivityIndicator size="small" color="#cc7700" />
                    : <Ionicons name="send" size={16} color="#cc7700" />}
                </View>
                <View>
                  <Text style={styles.rowTitle}>Send Test Notification</Text>
                  <Text style={styles.rowMeta}>Fires an instant demo alert</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* Push token chip */}
        {notifEnabled && (
          <View style={styles.tokenBox}>
            <Ionicons name="key-outline" size={12} color={CW.soft} />
            <Text style={styles.tokenText} numberOfLines={1}>
              {tokenText
                ? tokenText.slice(0, 40) + "…"
                : "Local only (Expo Go) — dev build needed for remote push"}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CW.bgAlt },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: CW.bg,
    borderBottomWidth: 1,
    borderBottomColor: CW.border,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CW.bgAlt,
    borderWidth: 1,
    borderColor: CW.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: CW.text,
    fontFamily: fontFamily.semibold,
    letterSpacing: -0.3,
  },
  headerSpacer: { width: 36 },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 20, gap: 16 },

  section: { gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: CW.soft,
    fontFamily: fontFamily.semibold,
    paddingLeft: 2,
  },
  settingsList: {
    backgroundColor: CW.bg,
    borderRadius: CW.r,
    borderWidth: 1,
    borderColor: CW.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: CW.border },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowTitle: { fontSize: 14, color: CW.text, fontFamily: fontFamily.regular },
  rowMeta:  { fontSize: 11, color: CW.soft, marginTop: 1, fontFamily: fontFamily.regular },
  chevron:  { fontSize: 14, color: CW.soft },

  tokenBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: CW.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CW.border,
  },
  tokenText: {
    fontSize: 10,
    color: CW.soft,
    fontFamily: fontFamily.regular,
    flex: 1,
  },

  pressed: { opacity: 0.7 },
});
