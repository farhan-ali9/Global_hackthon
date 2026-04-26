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
  getUserProfile,
} from "@/src/storage/userProfileStorage";
import { CW, fontFamily } from "@/src/theme/tokens";

const SAVED_ITEMS = [
  { label: "Coffee discount",  value: "€3.50",  date: "Today" },
  { label: "Transit pass",     value: "€12.00", date: "Yesterday" },
  { label: "Museum entry",     value: "€8.00",  date: "Apr 22" },
];

const REDEEMED_ITEMS = [
  { label: "Free coffee",        value: "150 pts", date: "Today" },
  { label: "10% off bookstore",  value: "200 pts", date: "Apr 20" },
  { label: "Cinema ticket",      value: "500 pts", date: "Apr 15" },
];

const ACCOUNT_SECTIONS = [
  { title: "Account",     items: ["Personal Information"] },
  { title: "Preferences", items: ["Language & Region", "Privacy & Data", "Notifications"] },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  const [displayName,  setDisplayName]  = useState("City Wallet user");
  const [displayCity,  setDisplayCity]  = useState("");
  const [memberSince,  setMemberSince]  = useState("Member");
  const [avatarColor,  setAvatarColor]  = useState(DEFAULT_AVATAR_COLOR);
  const [activeTab,    setActiveTab]    = useState<"saved" | "redeemed">("saved");

  /* Reload personal info every time the tab is focused (e.g. after editing) */
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      void Promise.all([getPersonalInfo(), getUserProfile()]).then(
        ([personalInfo, userProfile]) => {
          if (!isMounted) return;

          const preferredName =
            personalInfo?.name.trim() || userProfile?.displayName.trim() || "";
          setDisplayName(preferredName.length > 0 ? preferredName : "City Wallet user");

          const preferredCity = personalInfo?.city.trim() ?? "";
          setDisplayCity(preferredCity);

          setAvatarColor(personalInfo?.avatarColor ?? DEFAULT_AVATAR_COLOR);
          setMemberSince(
            userProfile?.completedAtIso
              ? `Member since ${new Date(userProfile.completedAtIso).getFullYear()}`
              : "Member",
          );
        },
      );
      return () => {
        isMounted = false;
      };
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
        {/* Avatar + name */}
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
              <Text style={styles.profileSub}>
                {displayCity ? `${displayCity} resident · ` : ""}
                {memberSince}
              </Text>
          </View>
        </View>

        {/* Points display */}
        <View style={styles.pointsBlock}>
          <Text style={styles.pointsLabel}>Total Points</Text>
          <Text style={styles.pointsValue}>1 240</Text>
        </View>

        {/* Saved / Redeemed tabs */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === "saved" && styles.tabActive]}
            onPress={() => setActiveTab("saved")}
          >
            <Text style={[styles.tabText, activeTab === "saved" && styles.tabTextActive]}>Saved</Text>
            <Text style={[styles.tabSub, activeTab === "saved" && styles.tabSubActive]}>€38</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "redeemed" && styles.tabActive]}
            onPress={() => setActiveTab("redeemed")}
          >
            <Text style={[styles.tabText, activeTab === "redeemed" && styles.tabTextActive]}>Redeemed</Text>
            <Text style={[styles.tabSub, activeTab === "redeemed" && styles.tabSubActive]}>12 offers</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tab content: Saved / Redeemed ── */}
        <View style={styles.tabContent}>
          {(activeTab === "saved" ? SAVED_ITEMS : REDEEMED_ITEMS).map((item, i, arr) => (
            <View
              key={i}
              style={[styles.activityRow, i < arr.length - 1 && styles.activityBorder]}
            >
              <View style={styles.activityDot} />
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>{item.label}</Text>
                <Text style={styles.activityDate}>{item.date}</Text>
              </View>
              <Text style={styles.activityValue}>{item.value}</Text>
            </View>
          ))}
        </View>

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

  /* points */
  pointsBlock: {
    alignItems: "center",
    paddingVertical: 14,
  },
  pointsLabel: {
    fontSize: 11,
    color: CW.soft,
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 42,
    fontWeight: "700",
    color: CW.text,
    fontFamily: fontFamily.bold,
    letterSpacing: -1.5,
  },

  /* tabs */
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: CW.border,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: CW.text,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: CW.soft,
    fontFamily: fontFamily.medium,
  },
  tabTextActive: {
    color: CW.text,
  },
  tabSub: {
    fontSize: 11,
    color: CW.soft,
    fontFamily: fontFamily.regular,
    marginTop: 1,
  },
  tabSubActive: {
    color: CW.mid,
  },

  /* tab content */
  tabContent: {
    backgroundColor: CW.bg,
    borderRadius: CW.r,
    borderWidth: 1,
    borderColor: CW.border,
    overflow: "hidden",
    marginBottom: 18,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: CW.border },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CW.border,
    flexShrink: 0,
  },
  activityInfo: { flex: 1 },
  activityLabel: { fontSize: 14, color: CW.text, fontFamily: fontFamily.regular },
  activityDate:  { fontSize: 11, color: CW.soft, marginTop: 1, fontFamily: fontFamily.regular },
  activityValue: { fontSize: 14, fontWeight: "600", color: CW.text, fontFamily: fontFamily.semibold },

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
