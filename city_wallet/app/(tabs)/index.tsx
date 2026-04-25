import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CW, fontFamily } from "@/src/theme/tokens";

const QUICK_ACTIONS = [
  { icon: "arrow-up-outline" as const, label: "Top Up" },
  { icon: "bus-outline" as const, label: "Transit" },
  { icon: "grid-outline" as const, label: "Services" },
  { icon: "qr-code-outline" as const, label: "Scan" },
];

const TRANSACTIONS = [
  { icon: "subway-outline" as const, name: "Metro Line 2", detail: "Transit · Today", amount: "−€ 2.90", color: "#e8f4f0", pos: false },
  { icon: "car-outline" as const, name: "City Parking", detail: "Services · Yesterday", amount: "−€ 6.00", color: "#f0eee8", pos: false },
  { icon: "wallet-outline" as const, name: "Wallet Top Up", detail: "Income · Apr 20", amount: "+€ 50.00", color: "#eaf0e8", pos: true },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.name}>Sofia M.</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>S</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCircle} />
          <Text style={styles.balanceLabel}>City Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>€ 284</Text>
            <Text style={styles.balanceCents}>.50</Text>
          </View>
          <View style={styles.balanceSubRow}>
            {[{ l: "Transit", v: "€ 40 left" }, { l: "City Tax", v: "Paid ✓" }].map((item, i) => (
              <View key={i} style={styles.balanceSub}>
                <Text style={styles.balanceSubLabel}>{item.l}</Text>
                <Text style={styles.balanceSubValue}>{item.v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((a, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.quickItem, pressed && styles.pressed]}
              onPress={a.label === "Scan" ? () => router.push("/scan" as Href) : undefined}
            >
              <View style={styles.quickIcon}>
                <Ionicons name={a.icon} size={22} color={CW.text} />
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent transactions */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionLabel}>Recent</Text>
          <Text style={styles.seeAll}>See all →</Text>
        </View>

        <View style={styles.txList}>
          {TRANSACTIONS.map((tx, i, arr) => (
            <View
              key={i}
              style={[styles.txRow, i < arr.length - 1 && styles.txBorder]}
            >
              <View style={[styles.txIcon, { backgroundColor: tx.color }]}>
                <Ionicons name={tx.icon} size={18} color={CW.text} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txName}>{tx.name}</Text>
                <Text style={styles.txDetail}>{tx.detail}</Text>
              </View>
              <Text style={[styles.txAmount, tx.pos && styles.txPos]}>{tx.amount}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CW.bgAlt },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingBottom: 14,
    paddingTop: 4,
  },
  greeting: { fontSize: 11, color: CW.soft, letterSpacing: 0.6, textTransform: "uppercase", fontFamily: fontFamily.medium },
  name: { fontSize: 21, fontWeight: "500", letterSpacing: -0.7, color: CW.text, marginTop: 2, fontFamily: fontFamily.medium },
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#c5a880",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "600", color: "#fff", fontFamily: fontFamily.bold },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 0 },

  /* balance card */
  balanceCard: {
    borderRadius: 22,
    backgroundColor: "#1a1a1c",
    padding: 22,
    marginBottom: 18,
    overflow: "hidden",
    position: "relative",
  },
  balanceCircle: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  balanceLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    fontFamily: fontFamily.semibold,
  },
  balanceRow: { flexDirection: "row", alignItems: "flex-end", gap: 2, marginTop: 6 },
  balanceAmount: { fontSize: 38, fontWeight: "300", color: "#fff", letterSpacing: -1.5, fontFamily: fontFamily.regular },
  balanceCents: { fontSize: 17, color: "rgba(255,255,255,0.4)", fontWeight: "300", marginBottom: 4, fontFamily: fontFamily.regular },
  balanceSubRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  balanceSub: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: 10,
  },
  balanceSubLabel: { fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, fontFamily: fontFamily.semibold },
  balanceSubValue: { fontSize: 13, fontWeight: "500", color: "#fff", marginTop: 2, fontFamily: fontFamily.medium },

  /* quick actions */
  sectionLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: CW.soft,
    fontFamily: fontFamily.semibold,
  },
  quickGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 18,
  },
  quickItem: { alignItems: "center", gap: 6 },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: CW.bg,
    borderWidth: 1,
    borderColor: CW.border,
    alignItems: "center",
    justifyContent: "center",
    ...({
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    } as object),
  },
  quickLabel: { fontSize: 10, color: CW.mid, fontWeight: "500", fontFamily: fontFamily.medium },

  /* transactions */
  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  seeAll: { fontSize: 12, color: CW.soft, fontWeight: "500", fontFamily: fontFamily.medium },
  txList: {},
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: CW.border },
  txIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: "500", color: CW.text, fontFamily: fontFamily.medium },
  txDetail: { fontSize: 11, color: CW.soft, marginTop: 1, fontFamily: fontFamily.regular },
  txAmount: { fontSize: 14, fontWeight: "500", color: CW.text, fontFamily: fontFamily.medium },
  txPos: { color: CW.green },

  pressed: { opacity: 0.7 },
});
