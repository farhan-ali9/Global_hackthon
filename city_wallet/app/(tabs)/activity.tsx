import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUserContextLoop } from "@/src/context-engine/UserContextLoopProvider";
import { CW, fontFamily } from "@/src/theme/tokens";

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { status, lastUpdatedAt, recommendation, error } = useUserContextLoop();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Pipeline activity before offer generation</Text>
      </View>

      {/* Summary pills */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Loop status</Text>
          <Text style={styles.summaryValue}>{status}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Last update</Text>
          <Text style={[styles.summaryValue, { color: CW.green }]}>
            {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : "n/a"}
          </Text>
        </View>
      </View>

      {/* List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Current run</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🧭</Text>
          <Text style={styles.emptyTitle}>Recommendation stage is active</Text>
          <Text style={styles.emptyText}>
            Latest recommendation: {recommendation?.merchantId ?? "none yet"}
          </Text>
          <Text style={styles.emptyText}>
            Offer generation and redemption flow are intentionally disabled.
          </Text>
          {error ? <Text style={[styles.emptyText, { color: "#9c2a2a" }]}>{error}</Text> : null}
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CW.bgAlt },
  header: {
    paddingHorizontal: 22,
    paddingBottom: 12,
    paddingTop: 4,
  },
  title: { fontSize: 21, fontWeight: "500", letterSpacing: -0.7, color: CW.text, fontFamily: fontFamily.medium },
  subtitle: { fontSize: 12, color: CW.soft, marginTop: 2, fontFamily: fontFamily.regular },

  summaryRow: { flexDirection: "row", gap: 10, paddingHorizontal: 22, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: CW.bg,
    borderRadius: 14,
    padding: 12,
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
  summaryValue: { fontSize: 22, fontWeight: "600", color: CW.text, marginTop: 4, letterSpacing: -0.7, fontFamily: fontFamily.bold },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 10 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: CW.soft,
    fontFamily: fontFamily.semibold,
    marginBottom: 4,
    paddingHorizontal: 6,
  },

  /* Empty state */
  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: CW.text, fontFamily: fontFamily.bold },
  emptyText: { fontSize: 13, color: CW.soft, textAlign: "center", lineHeight: 20, fontFamily: fontFamily.regular },
});
