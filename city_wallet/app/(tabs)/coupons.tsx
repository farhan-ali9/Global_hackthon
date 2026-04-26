import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUserContextLoop } from "@/src/context-engine/UserContextLoopProvider";
import type { GeneratedCouponResponse } from "@/src/types/city-wallet";
import { CW, fontFamily } from "@/src/theme/tokens";

function CouponFeedItem({ coupon }: { coupon: GeneratedCouponResponse }) {
  return (
    <View style={styles.couponCard}>
      <Text style={styles.couponHeadline}>{coupon.headline}</Text>
      <Text style={styles.couponBody}>{coupon.body}</Text>
      <Text style={styles.couponSaving}>{coupon.saving.displayText}</Text>
      <Text style={styles.couponMeta}>
        {coupon.merchantId.replace("merchant-", "").replaceAll("-", " ")} ·{" "}
        {coupon.ctaLabel} · Expires {formatExpiresAt(coupon.expiresAt)}
      </Text>
    </View>
  );
}

export default function CouponsScreen() {
  const insets = useSafeAreaInsets();
  const { context, coupons, couponError, status, error } =
    useUserContextLoop();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Generated Coupons</Text>
          <Text style={styles.subtitle}>A new coupon is added every loop cycle</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{coupons.length}</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Loop status: {status}</Text>
          <Text style={styles.statusBody}>City: {context?.cityId ?? "n/a"} · Zone: {context?.zoneId ?? "n/a"}</Text>
          <Text style={styles.statusBody}>Generated coupons: {coupons.length}</Text>
          <Text style={styles.statusBody}>Coupon status: {status === "refreshing" ? "generating" : "ready"}</Text>
          {couponError ? <Text style={styles.errorText}>{couponError}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
        {coupons.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.statusTitle}>No coupons yet</Text>
            <Text style={styles.statusBody}>
              The loop runs every 10 seconds and pushes each generated coupon here.
            </Text>
          </View>
        ) : (
          coupons.map((generatedCoupon, index) => (
            <CouponFeedItem
              key={`${generatedCoupon.merchantId}-${generatedCoupon.expiresAt}-${index}`}
              coupon={generatedCoupon}
            />
          ))
        )}
        <View style={{ height: 12 }} />
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
  couponCard: {
    backgroundColor: CW.bg,
    borderRadius: 14,
    borderColor: CW.border,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  couponHeadline: { fontSize: 15, fontWeight: "700", color: CW.text, fontFamily: fontFamily.bold },
  couponBody: { fontSize: 12, color: CW.soft, fontFamily: fontFamily.regular },
  couponSaving: { fontSize: 12, color: CW.text, fontFamily: fontFamily.semibold },
  couponMeta: { fontSize: 11, color: CW.soft, fontFamily: fontFamily.regular },
  statusCard: {
    backgroundColor: CW.bg,
    borderRadius: 14,
    borderColor: CW.border,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  statusTitle: { color: CW.text, fontFamily: fontFamily.bold, fontSize: 13 },
  statusBody: { color: CW.soft, fontFamily: fontFamily.regular, fontSize: 12 },
  emptyCard: {
    backgroundColor: CW.bg,
    borderRadius: 14,
    borderColor: CW.border,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 12,
    gap: 6,
  },
  errorText: { color: "#9c2a2a", fontFamily: fontFamily.medium, fontSize: 12 },
});

function formatExpiresAt(expiresAt: string) {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) {
    return "soon";
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
