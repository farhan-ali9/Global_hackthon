import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CW, fontFamily } from "@/src/theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

type TxItem = {
  icon: IoniconsName;
  name: string;
  cat: string;
  amount: string;
  color: string;
  pos?: boolean;
};

const GROUPS: { date: string; items: TxItem[] }[] = [
  {
    date: "Today",
    items: [
      { icon: "subway-outline", name: "Metro Line 2",   cat: "Transit",  amount: "−€ 2.90", color: "#e8f4f0" },
      { icon: "cafe-outline",   name: "City Café",      cat: "Payment",  amount: "−€ 4.20", color: "#f5f0e8" },
    ],
  },
  {
    date: "Yesterday",
    items: [
      { icon: "car-outline",    name: "City Parking P6", cat: "Services", amount: "−€ 6.00",  color: "#f0eee8" },
      { icon: "bus-outline",    name: "Bus Line 58",      cat: "Transit",  amount: "−€ 1.70",  color: "#e8f4f0" },
      { icon: "wallet-outline", name: "Top Up",           cat: "Income",   amount: "+€ 50.00", color: "#eaf0e8", pos: true },
    ],
  },
  {
    date: "Apr 20",
    items: [
      { icon: "leaf-outline",     name: "English Garden", cat: "Park Fee",  amount: "−€ 3.00",  color: "#eef8ee" },
      { icon: "document-outline", name: "Permit Renewal", cat: "Services", amount: "−€ 15.00", color: "#f0eee8" },
    ],
  },
];

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Pressable style={styles.filterBtn}>
          <Text style={styles.filterBtnText}>Filter</Text>
        </Pressable>
      </View>

      {/* Summary pills */}
      <View style={styles.summaryRow}>
        {[{ l: "Spent this month", v: "€ 63.80" }, { l: "Transit trips", v: "14" }].map((st, i) => (
          <View key={i} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{st.l}</Text>
            <Text style={styles.summaryValue}>{st.v}</Text>
          </View>
        ))}
      </View>

      {/* Transaction groups */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {GROUPS.map((g, gi) => (
          <View key={gi} style={styles.group}>
            <Text style={styles.groupDate}>{g.date}</Text>
            <View style={styles.groupList}>
              {g.items.map((tx, ti, arr) => (
                <View
                  key={ti}
                  style={[styles.txRow, ti < arr.length - 1 && styles.txBorder]}
                >
                  <View style={[styles.txIcon, { backgroundColor: tx.color }]}>
                    <Ionicons name={tx.icon} size={17} color={CW.text} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txName}>{tx.name}</Text>
                    <Text style={styles.txCat}>{tx.cat}</Text>
                  </View>
                  <Text style={[styles.txAmount, tx.pos && styles.txPos]}>
                    {tx.amount}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
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
    paddingBottom: 12,
    paddingTop: 4,
  },
  title: { fontSize: 21, fontWeight: "500", letterSpacing: -0.7, color: CW.text, fontFamily: fontFamily.medium },
  filterBtn: {
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: CW.pill,
    borderWidth: 1,
    borderColor: CW.border,
    backgroundColor: CW.bg,
  },
  filterBtnText: { fontSize: 12, fontWeight: "500", color: CW.mid, fontFamily: fontFamily.medium },

  summaryRow: { flexDirection: "row", gap: 10, paddingHorizontal: 22, marginBottom: 14 },
  summaryCard: {
    flex: 1,
    backgroundColor: CW.bg,
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: CW.border,
    ...({
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    } as object),
  },
  summaryLabel: { fontSize: 10, color: CW.soft, textTransform: "uppercase", letterSpacing: 0.7, fontFamily: fontFamily.semibold },
  summaryValue: { fontSize: 19, fontWeight: "500", color: CW.text, marginTop: 4, letterSpacing: -0.7, fontFamily: fontFamily.medium },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 0 },

  group: { marginBottom: 18 },
  groupDate: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: CW.soft,
    fontFamily: fontFamily.semibold,
    marginBottom: 8,
  },
  groupList: {
    backgroundColor: CW.bg,
    borderRadius: CW.r,
    borderWidth: 1,
    borderColor: CW.border,
    overflow: "hidden",
  },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: CW.border },
  txIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: "500", color: CW.text, fontFamily: fontFamily.medium },
  txCat: { fontSize: 11, color: CW.soft, marginTop: 1, fontFamily: fontFamily.regular },
  txAmount: { fontSize: 13, fontWeight: "500", color: CW.text, fontFamily: fontFamily.medium },
  txPos: { color: CW.green },
});
