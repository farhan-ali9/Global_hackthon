import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUserContextLoop } from "@/src/context-engine/UserContextLoopProvider";
import type { GeneratedCouponResponse } from "@/src/types/city-wallet";
import { CW, fontFamily } from "@/src/theme/tokens";

const ACCENT = "#2563EB";
const ACCENT_LIGHT = "#EFF6FF";
const GREEN = "#16A34A";
const GREEN_LIGHT = "#F0FDF4";

function formatExpiresAt(expiresAt: string) {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "soon";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function merchantLabel(id: string) {
  return id
    .replace("merchant-", "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function DiscountBadge({ saving }: { saving: GeneratedCouponResponse["saving"] }) {
  const label =
    saving.type === "percentage"
      ? `${Math.round(saving.value)}% OFF`
      : `${saving.currency} ${saving.amount} OFF`;
  return (
    <View style={styles.discountBadge}>
      <Text style={styles.discountBadgeText}>{label}</Text>
    </View>
  );
}

function CouponCard({ coupon }: { coupon: GeneratedCouponResponse }) {
  const expiresLabel = formatExpiresAt(coupon.expiresAt);
  return (
    <View style={styles.couponCard}>
      <View style={styles.couponCardTop}>
        <View style={styles.couponCardTopLeft}>
          <Text style={styles.couponMerchant}>{merchantLabel(coupon.merchantId)}</Text>
          <Text style={styles.couponHeadline}>{coupon.headline}</Text>
        </View>
        <DiscountBadge saving={coupon.saving} />
      </View>

      <View style={styles.divider} />

      <Text style={styles.couponBody}>{coupon.body}</Text>

      {coupon.explanationTags?.length > 0 && (
        <View style={styles.tagsRow}>
          {coupon.explanationTags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.couponFooter}>
        <View style={styles.expiryRow}>
          <Ionicons name="time-outline" size={13} color={CW.soft} />
          <Text style={styles.expiryText}>Expires {expiresLabel}</Text>
        </View>
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.8}>
          <Text style={styles.ctaBtnText}>{coupon.ctaLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyState({ status, couponError }: { status: string; couponError: string | null }) {
  const isGenerating = status === "refreshing";
  return (
    <View style={styles.emptyState}>
      {isGenerating ? (
        <ActivityIndicator size="large" color={ACCENT} />
      ) : (
        <Ionicons name="ticket-outline" size={48} color={CW.soft} />
      )}
      <Text style={styles.emptyTitle}>
        {isGenerating ? "Finding the best deal for you…" : "No coupons yet"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {couponError
          ? couponError
          : isGenerating
            ? "Our AI is generating a personalised offer"
            : "Walk around and the app will suggest relevant offers nearby"}
      </Text>
    </View>
  );
}

export default function CouponsScreen() {
  const insets = useSafeAreaInsets();
  const { coupon, couponError, status } = useUserContextLoop();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Coupons</Text>
        <Text style={styles.subtitle}>AI-picked offers based on where you are</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {coupon ? (
          <>
            <View style={styles.sectionLabel}>
              <View style={styles.liveIndicator} />
              <Text style={styles.sectionLabelText}>Active offer</Text>
            </View>
            <CouponCard coupon={coupon} />
          </>
        ) : (
          <EmptyState status={status} couponError={couponError} />
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CW.bgAlt },

  header: {
    paddingHorizontal: 22,
    paddingBottom: 16,
    paddingTop: 6,
  },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.8, color: CW.text, fontFamily: fontFamily.bold },
  subtitle: { fontSize: 13, color: CW.soft, marginTop: 3, fontFamily: fontFamily.regular },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },

  sectionLabel: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 2 },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  sectionLabelText: { fontSize: 12, fontWeight: "600", color: GREEN, fontFamily: fontFamily.semibold, textTransform: "uppercase", letterSpacing: 0.5 },

  /* Coupon card */
  couponCard: {
    backgroundColor: CW.bg,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  } as object,
  couponCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  couponCardTopLeft: { flex: 1, gap: 4 },
  couponMerchant: { fontSize: 12, fontWeight: "600", color: ACCENT, fontFamily: fontFamily.semibold, textTransform: "uppercase", letterSpacing: 0.4 },
  couponHeadline: { fontSize: 20, fontWeight: "700", color: CW.text, fontFamily: fontFamily.bold, letterSpacing: -0.4, lineHeight: 26 },
  couponBody: { fontSize: 14, color: CW.soft, fontFamily: fontFamily.regular, lineHeight: 20 },

  discountBadge: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    flexShrink: 0,
  },
  discountBadgeText: { color: "#fff", fontSize: 13, fontWeight: "800", fontFamily: fontFamily.extrabold },

  divider: { height: 1, backgroundColor: CW.border },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { backgroundColor: ACCENT_LIGHT, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, color: ACCENT, fontFamily: fontFamily.semibold },

  couponFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  expiryRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  expiryText: { fontSize: 12, color: CW.soft, fontFamily: fontFamily.regular },
  ctaBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  ctaBtnText: { color: "#fff", fontSize: 14, fontWeight: "700", fontFamily: fontFamily.bold },

  /* Empty */
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: CW.text, fontFamily: fontFamily.bold, textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: CW.soft, fontFamily: fontFamily.regular, textAlign: "center", lineHeight: 20 },
});

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
