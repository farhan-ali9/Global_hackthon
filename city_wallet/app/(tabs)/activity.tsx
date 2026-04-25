import { useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { REDEEMED_COUPONS } from "@/src/data/mockData";
import type { Coupon } from "@/src/types/city-wallet";
import { CW, fontFamily } from "@/src/theme/tokens";

function RedeemedCard({ coupon, onPress }: { coupon: Coupon; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Color strip */}
      <View style={[styles.strip, { backgroundColor: coupon.brandColor }]}>
        <View style={[styles.stripLogo, { backgroundColor: coupon.accentColor }]}>
          <Text style={styles.stripLogoText}>{coupon.logoLetter}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.company}>{coupon.company}</Text>
          <View style={[styles.redeemedBadge]}>
            <Text style={styles.redeemedText}>✓ Redeemed</Text>
          </View>
        </View>
        <Text style={styles.offer}>{coupon.offer} — {coupon.offerDetail}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>{coupon.redeemedAt}</Text>
          {coupon.savings && (
            <Text style={styles.savings}>Saved {coupon.savings}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const totalSaved = REDEEMED_COUPONS
    .filter((c) => c.savings)
    .reduce((sum, c) => {
      const n = parseFloat((c.savings ?? "€ 0").replace(/[^0-9.]/g, ""));
      return sum + n;
    }, 0)
    .toFixed(2);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Recently redeemed coupons</Text>
      </View>

      {/* Summary pills */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Coupons redeemed</Text>
          <Text style={styles.summaryValue}>{REDEEMED_COUPONS.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total saved</Text>
          <Text style={[styles.summaryValue, { color: CW.green }]}>€ {totalSaved}</Text>
        </View>
      </View>

      {/* List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>History</Text>

        {REDEEMED_COUPONS.map((c) => (
          <RedeemedCard
            key={c.id}
            coupon={c}
            onPress={() => router.push(`/coupon/${c.id}` as Href)}
          />
        ))}

        {REDEEMED_COUPONS.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎟</Text>
            <Text style={styles.emptyTitle}>No redeemed coupons yet</Text>
            <Text style={styles.emptyText}>
              Browse the Coupons tab and redeem your first deal.
            </Text>
          </View>
        )}

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

  /* Redeemed card */
  card: {
    backgroundColor: CW.bg,
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: CW.border,
    ...({
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    } as object),
  },
  pressed: { opacity: 0.8 },
  strip: { width: 6, flexShrink: 0 },
  stripLogo: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    left: -14,
    top: "50%",
    marginTop: -17,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    borderWidth: 2,
    borderColor: CW.bg,
  },
  stripLogoText: { fontSize: 14, fontWeight: "800", color: "#fff", fontFamily: fontFamily.extrabold },

  cardBody: { flex: 1, paddingLeft: 26, paddingRight: 14, paddingVertical: 12, gap: 4 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  company: { fontSize: 14, fontWeight: "700", color: CW.text, fontFamily: fontFamily.bold },
  redeemedBadge: {
    backgroundColor: "#EAF7F0",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  redeemedText: { fontSize: 10, fontWeight: "600", color: "#2d6a4f", fontFamily: fontFamily.semibold },
  offer: { fontSize: 13, color: CW.mid, fontFamily: fontFamily.regular },
  cardMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  metaText: { fontSize: 11, color: CW.soft, fontFamily: fontFamily.regular },
  savings: { fontSize: 11, fontWeight: "700", color: CW.green, fontFamily: fontFamily.bold },

  /* Empty state */
  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: CW.text, fontFamily: fontFamily.bold },
  emptyText: { fontSize: 13, color: CW.soft, textAlign: "center", lineHeight: 20, fontFamily: fontFamily.regular },
});
