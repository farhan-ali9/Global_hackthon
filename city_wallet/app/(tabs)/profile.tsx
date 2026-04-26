import { Ionicons } from "@expo/vector-icons";
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

const STATS = [
  { l: "City Score", v: "94" },
  { l: "Trips",      v: "340" },
  { l: "CO₂ Saved",  v: "128kg" },
];

const ACCOUNT_SECTIONS = [
  { title: "Account",     items: ["Personal Information", "City Registration", "Linked Documents"] },
  { title: "Wallet",      items: ["Payment Methods", "Auto Top-up", "Spending Limits"] },
  { title: "Preferences", items: ["Language & Region", "Privacy & Data"] },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const [notifEnabled, setNotifEnabled]   = useState(false);
  const [tokenText, setTokenText]         = useState<string | null>(null);
  const [registering, setRegistering]     = useState(false);
  const [sending, setSending]             = useState(false);

  /* Try to auto-register on mount (permission may already be granted) */
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

  async function handleScheduleDigest() {
    if (!notifEnabled) {
      Alert.alert("Enable notifications first", "Toggle notifications on above.");
      return;
    }
    await scheduleCouponDigest(10);
    Alert.alert("Scheduled", "A digest notification will arrive in ~10 seconds.\nBackground the app to see it.");
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Profile card ── */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Sofia Müller</Text>
            <Text style={styles.profileSub}>Linz resident · Member since 2022</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          {STATS.map((st, i) => (
            <View key={i} style={styles.statBox}>
              <Text style={styles.statValue}>{st.v}</Text>
              <Text style={styles.statLabel}>{st.l}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Notifications section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notifications</Text>
          <View style={styles.settingsList}>

            {/* Toggle row */}
            <View style={[styles.settingsRow, styles.settingsBorder]}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBubble, { backgroundColor: "#e8f5ee" }]}>
                  <Ionicons name="notifications" size={16} color="#2d6a4f" />
                </View>
                <View>
                  <Text style={styles.settingsItem}>Coupon Alerts</Text>
                  <Text style={styles.settingsMeta}>
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

            {/* Digest row */}
            <Pressable
              style={({ pressed }) => [styles.settingsRow, styles.settingsBorder, pressed && styles.pressed]}
              onPress={handleScheduleDigest}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBubble, { backgroundColor: "#eef3ff" }]}>
                  <Ionicons name="time" size={16} color="#3355cc" />
                </View>
                <View>
                  <Text style={styles.settingsItem}>Nearby Digest</Text>
                  <Text style={styles.settingsMeta}>Schedule a digest in 10 s</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {/* Test notification button */}
            <Pressable
              style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
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
                  <Text style={styles.settingsItem}>Send Test Notification</Text>
                  <Text style={styles.settingsMeta}>Fires an instant demo alert</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>

          {/* Push token chip – shown when notifications are enabled */}
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
        </View>

        {/* ── Account / Wallet / Preferences ── */}
        {ACCOUNT_SECTIONS.map((sec, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionLabel}>{sec.title}</Text>
            <View style={styles.settingsList}>
              {sec.items.map((item, ii, arr) => (
                <Pressable
                  key={ii}
                  style={({ pressed }) => [
                    styles.settingsRow,
                    ii < arr.length - 1 && styles.settingsBorder,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.settingsItem}>{item}</Text>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && styles.pressed]}
        >
          <Ionicons name="log-out-outline" size={16} color="#b94040" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CW.bgAlt },

  profileCard: {
    backgroundColor: CW.bg,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: CW.border,
  },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#c5a880",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "600", color: "#fff", fontFamily: fontFamily.bold },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 19,
    fontWeight: "500",
    letterSpacing: -0.5,
    color: CW.text,
    fontFamily: fontFamily.medium,
  },
  profileSub: { fontSize: 12, color: CW.soft, marginTop: 2, fontFamily: fontFamily.regular },

  statsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  statBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: CW.bgAlt,
    borderRadius: 12,
    paddingVertical: 10,
  },
  statValue: {
    fontSize: 17,
    fontWeight: "600",
    color: CW.text,
    letterSpacing: -0.5,
    fontFamily: fontFamily.bold,
  },
  statLabel: {
    fontSize: 9,
    color: CW.soft,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginTop: 2,
    fontFamily: fontFamily.semibold,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 16 },

  section: { marginBottom: 18 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: CW.soft,
    marginBottom: 10,
    fontFamily: fontFamily.semibold,
  },
  settingsList: {
    backgroundColor: CW.bg,
    borderRadius: CW.r,
    borderWidth: 1,
    borderColor: CW.border,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  settingsBorder: { borderBottomWidth: 1, borderBottomColor: CW.border },
  settingsItem: { fontSize: 14, color: CW.text, fontFamily: fontFamily.regular },
  settingsMeta: { fontSize: 11, color: CW.soft, marginTop: 1, fontFamily: fontFamily.regular },
  chevron: { fontSize: 14, color: CW.soft },

  tokenBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
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

  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: CW.pill,
    borderWidth: 1,
    borderColor: "rgba(200,60,60,0.2)",
    backgroundColor: "rgba(255,240,240,0.9)",
    marginBottom: 4,
  },
  signOutText: { fontSize: 14, fontWeight: "500", color: "#b94040", fontFamily: fontFamily.medium },

  pressed: { opacity: 0.7 },
});
