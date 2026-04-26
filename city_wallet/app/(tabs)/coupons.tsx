import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COUPONS } from "@/src/data/mockData";
import type { Coupon, CouponCategory } from "@/src/types/city-wallet";
import { CW, fontFamily } from "@/src/theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const CATEGORY_ICON: Record<CouponCategory, IoniconsName> = {
  food:          "restaurant-outline",
  retail:        "bag-outline",
  entertainment: "film-outline",
  wellness:      "fitness-outline",
  transport:     "bus-outline",
};

function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

function CouponCard({ coupon, onPress }: { coupon: Coupon; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
      onPress={onPress}
    >
      {/* Brand color header */}
      <View style={[styles.cardHeader, { backgroundColor: coupon.brandColor }]}>
        {/* Logo circle */}
        <View style={[styles.logoCircle, { backgroundColor: coupon.accentColor }]}>
          <Text style={styles.logoLetter}>{coupon.logoLetter}</Text>
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.companyName}>{coupon.company}</Text>
          <View style={styles.distRow}>
            <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.7)" />
            <Text style={styles.distance}>{formatDistance(coupon.distanceMeters)} away</Text>
          </View>
        </View>

        {/* Offer badge */}
        <View style={[styles.offerBadge, { backgroundColor: coupon.accentColor }]}>
          <Text style={[styles.offerBadgeText, { color: coupon.brandColor }]}>{coupon.offer}</Text>
        </View>
      </View>

      {/* White body */}
      <View style={styles.cardBody}>
        <View style={styles.cardBodyLeft}>
          <Text style={styles.offerDetail}>{coupon.offerDetail}</Text>
          <View style={styles.metaRow}>
            <Ionicons name={CATEGORY_ICON[coupon.category]} size={11} color={CW.soft} />
            <Text style={styles.metaText}>{coupon.location}</Text>
          </View>
        </View>
        <View style={styles.cardBodyRight}>
          <Text style={styles.validLabel}>Valid until</Text>
          <Text style={styles.validDate}>{coupon.validUntil}</Text>
          {coupon.savings && (
            <Text style={styles.savings}>Save {coupon.savings}</Text>
          )}
        </View>
      </View>

      {/* Perforated divider */}
      <View style={styles.perfRow}>
        <View style={[styles.perfCircle, styles.perfLeft, { backgroundColor: CW.bgAlt }]} />
        {Array.from({ length: 14 }).map((_, i) => (
          <View key={i} style={styles.dash} />
        ))}
        <View style={[styles.perfCircle, styles.perfRight, { backgroundColor: CW.bgAlt }]} />
      </View>

      {/* Footer */}
      <View style={[styles.cardFooter, { backgroundColor: coupon.brandColor + "18" }]}>
        <Ionicons name="qr-code-outline" size={14} color={coupon.brandColor} />
        <Text style={[styles.footerText, { color: coupon.brandColor }]}>Tap to view QR code</Text>
        <Ionicons name="chevron-forward" size={14} color={coupon.brandColor} />
      </View>
    </Pressable>
  );
}

export default function CouponsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Nearby Coupons</Text>
          <Text style={styles.subtitle}>Sorted by distance · Linz</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{COUPONS.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {COUPONS.map((c) => (
          <CouponCard
            key={c.id}
            coupon={c}
            onPress={() => router.push(`/coupon/${c.id}` as Href)}
          />
        ))}
        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}

const CARD_RADIUS = 18;

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
  title: { fontSize: 21, fontWeight: "500", letterSpacing: -0.7, color: CW.text, fontFamily: fontFamily.medium },
  subtitle: { fontSize: 12, color: CW.soft, marginTop: 2, fontFamily: fontFamily.regular },
  countBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: CW.text,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { color: "#fff", fontSize: 13, fontWeight: "700", fontFamily: fontFamily.bold },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 14 },

  /* Card */
  card: {
    borderRadius: CARD_RADIUS,
    backgroundColor: CW.bg,
    overflow: "hidden",
    ...({
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    } as object),
  },

  /* Header */
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoLetter: { fontSize: 20, fontWeight: "800", color: "#fff", fontFamily: fontFamily.extrabold },
  cardHeaderText: { flex: 1 },
  companyName: { fontSize: 15, fontWeight: "700", color: "#fff", fontFamily: fontFamily.bold },
  distRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  distance: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: fontFamily.regular },

  offerBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  offerBadgeText: { fontSize: 13, fontWeight: "800", fontFamily: fontFamily.extrabold },

  /* Body */
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardBodyLeft: { flex: 1, gap: 5 },
  offerDetail: { fontSize: 14, fontWeight: "600", color: CW.text, fontFamily: fontFamily.bold },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: CW.soft, fontFamily: fontFamily.regular, flex: 1 },
  cardBodyRight: { alignItems: "flex-end", gap: 2, marginLeft: 8 },
  validLabel: { fontSize: 9, color: CW.soft, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: fontFamily.semibold },
  validDate: { fontSize: 11, fontWeight: "600", color: CW.mid, fontFamily: fontFamily.semibold },
  savings: { fontSize: 11, fontWeight: "700", color: CW.green, marginTop: 2, fontFamily: fontFamily.bold },

  /* Perforated edge */
  perfRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 0,
    position: "relative",
    height: 12,
  },
  perfCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: "absolute",
    zIndex: 2,
  },
  perfLeft: { left: -7 },
  perfRight: { right: -7 },
  dash: {
    flex: 1,
    height: 1,
    backgroundColor: CW.border,
  },

  /* Footer */
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
  },
  footerText: { fontSize: 12, fontWeight: "600", fontFamily: fontFamily.semibold },
});
