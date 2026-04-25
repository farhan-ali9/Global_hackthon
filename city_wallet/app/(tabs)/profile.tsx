import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CW, fontFamily } from "@/src/theme/tokens";

const STATS = [
  { l: "City Score", v: "94" },
  { l: "Trips", v: "340" },
  { l: "CO₂ Saved", v: "128kg" },
];

const SECTIONS = [
  { title: "Account",     items: ["Personal Information", "City Registration", "Linked Documents"] },
  { title: "Wallet",      items: ["Payment Methods", "Auto Top-up", "Spending Limits"] },
  { title: "Preferences", items: ["Notifications", "Language & Region", "Privacy & Data"] },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Sofia Müller</Text>
            <Text style={styles.profileSub}>Munich resident · Member since 2022</Text>
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

      {/* Settings list */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((sec, si) => (
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
  profileName: { fontSize: 19, fontWeight: "500", letterSpacing: -0.5, color: CW.text, fontFamily: fontFamily.medium },
  profileSub: { fontSize: 12, color: CW.soft, marginTop: 2, fontFamily: fontFamily.regular },

  statsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  statBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: CW.bgAlt,
    borderRadius: 12,
    paddingVertical: 10,
  },
  statValue: { fontSize: 17, fontWeight: "600", color: CW.text, letterSpacing: -0.5, fontFamily: fontFamily.bold },
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
  settingsBorder: { borderBottomWidth: 1, borderBottomColor: CW.border },
  settingsItem: { fontSize: 14, color: CW.text, fontFamily: fontFamily.regular },
  chevron: { fontSize: 14, color: CW.soft },

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
