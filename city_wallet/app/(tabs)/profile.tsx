import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cancelAllNotifications } from "@/src/services/notifications";
import {
  DEFAULT_AVATAR_COLOR,
  getPersonalInfo,
} from "@/src/storage/userProfileStorage";
import { CW, fontFamily } from "@/src/theme/tokens";

const STATS = [
  { l: "Points",   v: "1 240" },
  { l: "Saved",    v: "€38" },
  { l: "Redeemed", v: "12" },
];

const ACCOUNT_SECTIONS = [
  { title: "Account",     items: ["Personal Information"] },
  { title: "Preferences", items: ["Language & Region", "Privacy & Data", "Notifications"] },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  const [displayName,  setDisplayName]  = useState("Sofia Müller");
  const [displayCity,  setDisplayCity]  = useState("Linz");
  const [avatarColor,  setAvatarColor]  = useState(DEFAULT_AVATAR_COLOR);

  /* Reload personal info every time the tab is focused (e.g. after editing) */
  useFocusEffect(
    useCallback(() => {
      void getPersonalInfo().then((info) => {
        if (info) {
          if (info.name) setDisplayName(info.name);
          if (info.city) setDisplayCity(info.city);
          setAvatarColor(info.avatarColor);
        }
      });
    }, []),
  );

  function handleSignOut() {
    Alert.alert(
      "Sign out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await cancelAllNotifications();
            // Walk up to the root Stack navigator (parent of the tabs navigator)
            // and navigate to the "index" screen (app/index.tsx = welcome screen)
            const rootNav = navigation.getParent();
            if (rootNav) {
              rootNav.reset({
                index: 0,
                routes: [{ name: "index" as never }],
              });
            } else {
              router.replace("/");
            }
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Profile card ── */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            onPress={() => router.push("/personal-information")}
          >
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>
                {displayName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?"}
              </Text>
            </View>
          </Pressable>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileSub}>{displayCity ? `${displayCity} resident · ` : ""}Member since 2022</Text>
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
        {/* ── Account / Preferences ── */}
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
                  onPress={() => {
                    if (item === "Personal Information") router.push("/personal-information");
                    if (item === "Notifications") router.push("/notifications");
                  }}
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
          onPress={handleSignOut}
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
