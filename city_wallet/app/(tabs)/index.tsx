import { useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COUPONS, REDEEMED_COUPONS } from "@/src/data/mockData";
import type { Coupon } from "@/src/types/city-wallet";
import { CW, fontFamily } from "@/src/theme/tokens";

/* ── derived stats ── */
const totalSaved = REDEEMED_COUPONS.filter((c) => c.savings).reduce((sum, c) => {
  return sum + parseFloat((c.savings ?? "€0").replace(/[^0-9.]/g, ""));
}, 0);

const POINTS = 1_240;

/* ── compact redeemed-coupon row ── */
function RecentRow({ coupon, onPress }: { coupon: Coupon; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Logo circle */}
      <View style={[styles.recentLogo, { backgroundColor: coupon.brandColor }]}>
        <Text style={styles.recentLogoText}>{coupon.logoLetter}</Text>
      </View>

      {/* Info */}
      <View style={styles.recentInfo}>
        <Text style={styles.recentCompany}>{coupon.company}</Text>
        <Text style={styles.recentOffer} numberOfLines={1}>
          {coupon.offer} — {coupon.offerDetail}
        </Text>
      </View>

      {/* Right */}
      <View style={styles.recentRight}>
        {coupon.savings && (
          <Text style={styles.recentSavings}>−{coupon.savings}</Text>
        )}
        <Text style={styles.recentTime}>{coupon.redeemedAt?.split(",")[0] ?? ""}</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.name}>Sofia M.</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>S</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Rewards card ── */}
        <View style={styles.card}>
          {/* decorative circles */}
          <View style={styles.deco1} />
          <View style={styles.deco2} />

          <Text style={styles.cardLabel}>City Wallet</Text>

          {/* Points — main number */}
          <View style={styles.pointsRow}>
            <Text style={styles.pointsNum}>{POINTS.toLocaleString()}</Text>
            <Text style={styles.pointsUnit}> pts</Text>
          </View>

          {/* Three sub-stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Saved</Text>
              <Text style={styles.statValue}>€ {totalSaved.toFixed(2)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Redeemed</Text>
              <Text style={styles.statValue}>{REDEEMED_COUPONS.length}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Available</Text>
              <Text style={styles.statValue}>{COUPONS.length}</Text>
            </View>
          </View>
        </View>

        {/* ── Recent section ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Recently Redeemed</Text>
          <Pressable
            style={({ pressed }) => [styles.seeAllBtn, pressed && styles.pressed]}
            onPress={() => router.push("/(tabs)/activity" as Href)}
          >
            <Text style={styles.seeAllText}>See all →</Text>
          </Pressable>
        </View>

        {REDEEMED_COUPONS.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No redeemed coupons yet. Browse the Coupons tab!</Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {REDEEMED_COUPONS.map((c, i, arr) => (
              <View key={c.id}>
                <RecentRow
                  coupon={c}
                  onPress={() => router.push(`/coupon/${c.id}` as Href)}
                />
                {i < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CW.bgAlt },

  /* header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingBottom: 14,
    paddingTop: 4,
  },
  greeting: {
    fontSize: 11,
    color: CW.soft,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontFamily: fontFamily.medium,
  },
  name: {
    fontSize: 21,
    fontWeight: "500",
    letterSpacing: -0.7,
    color: CW.text,
    marginTop: 2,
    fontFamily: fontFamily.medium,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#c5a880",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "600", color: "#fff", fontFamily: fontFamily.bold },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, gap: 20 },

  /* ── rewards card ── */
  card: {
    borderRadius: 24,
    backgroundColor: "#1a1a1c",
    padding: 22,
    overflow: "hidden",
    position: "relative",
  },
  deco1: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  deco2: {
    position: "absolute",
    bottom: -20,
    left: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  cardLabel: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    fontFamily: fontFamily.semibold,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 8,
    marginBottom: 20,
  },
  pointsNum: {
    fontSize: 42,
    fontWeight: "300",
    color: "#fff",
    letterSpacing: -2,
    fontFamily: fontFamily.regular,
  },
  pointsUnit: {
    fontSize: 18,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "300",
    marginBottom: 6,
    fontFamily: fontFamily.regular,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
  },
  statDivider: { width: 8 },
  statLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: fontFamily.semibold,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: -0.3,
    fontFamily: fontFamily.bold,
  },

  /* ── section header ── */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: CW.soft,
    fontFamily: fontFamily.semibold,
  },
  seeAllBtn: {},
  seeAllText: {
    fontSize: 12,
    color: CW.mid,
    fontWeight: "500",
    fontFamily: fontFamily.medium,
  },

  /* ── recent list ── */
  recentList: {
    backgroundColor: CW.bg,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: CW.border,
    ...({
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    } as object),
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: CW.border,
    marginLeft: 64,
  },
  recentLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  recentLogoText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    fontFamily: fontFamily.extrabold,
  },
  recentInfo: { flex: 1, gap: 3 },
  recentCompany: {
    fontSize: 14,
    fontWeight: "600",
    color: CW.text,
    fontFamily: fontFamily.bold,
  },
  recentOffer: {
    fontSize: 12,
    color: CW.soft,
    fontFamily: fontFamily.regular,
  },
  recentRight: { alignItems: "flex-end", gap: 3 },
  recentSavings: {
    fontSize: 13,
    fontWeight: "700",
    color: CW.green,
    fontFamily: fontFamily.bold,
  },
  recentTime: {
    fontSize: 10,
    color: CW.soft,
    fontFamily: fontFamily.regular,
  },

  /* empty */
  empty: {
    backgroundColor: CW.bg,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: CW.border,
  },
  emptyText: {
    fontSize: 13,
    color: CW.soft,
    textAlign: "center",
    fontFamily: fontFamily.regular,
  },

  pressed: { opacity: 0.7 },
});
