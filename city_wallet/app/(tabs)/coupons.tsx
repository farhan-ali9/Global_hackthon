import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUserContextLoop } from "@/src/context-engine/UserContextLoopProvider";
import type { GeneratedCouponResponse } from "@/src/types/city-wallet";
import { CW, fontFamily } from "@/src/theme/tokens";

// ─── Colour palette keyed by merchant type ───────────────────────────────────
const MERCHANT_COLORS: Record<string, { bg: string; accent: string; light: string }> = {
  cafe:       { bg: "#4E342E", accent: "#FFCC80", light: "#FFF3E0" },
  eis:        { bg: "#1565C0", accent: "#90CAF9", light: "#E3F2FD" },
  bistro:     { bg: "#E65100", accent: "#FFCC02", light: "#FFF8E1" },
  bakery:     { bg: "#BF360C", accent: "#FFAB91", light: "#FBE9E7" },
  ars:        { bg: "#4527A0", accent: "#CE93D8", light: "#F3E5F5" },
  buchhandlung: { bg: "#1B5E20", accent: "#A5D6A7", light: "#E8F5E9" },
  spendenkiosk: { bg: "#006064", accent: "#80DEEA", light: "#E0F7FA" },
  default:    { bg: "#1A237E", accent: "#90CAF9", light: "#E8EAF6" },
};

function getMerchantColors(merchantId: string) {
  for (const key of Object.keys(MERCHANT_COLORS)) {
    if (key !== "default" && merchantId.includes(key)) {
      return MERCHANT_COLORS[key];
    }
  }
  return MERCHANT_COLORS.default;
}

function merchantLabel(id: string) {
  return id
    .replace("merchant-", "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatExpiresAt(expiresAt: string) {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "soon";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(expiresAt: string) {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" });
}

function makeRedemptionCode(merchantId: string, expiresAt: string) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seed = merchantId + expiresAt;
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[seed.charCodeAt(i % seed.length) % chars.length];
  }
  return code;
}

// ─── Full-screen ticket modal ────────────────────────────────────────────────
function TicketModal({
  coupon,
  visible,
  onClose,
}: {
  coupon: GeneratedCouponResponse;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const colors = getMerchantColors(coupon.merchantId);
  const code = makeRedemptionCode(coupon.merchantId, coupon.expiresAt);
  const qrValue = JSON.stringify({ merchantId: coupon.merchantId, code, expiresAt: coupon.expiresAt });
  const discountLabel =
    coupon.saving.type === "percentage"
      ? `${Math.round(coupon.saving.value)}% OFF`
      : `${coupon.saving.currency ?? "€"} ${coupon.saving.amount} OFF`;

  const slideAnim = useRef(new Animated.Value(800)).current;

  // Animate in/out when visibility changes
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(800);
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 22,
        stiffness: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 800,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.6)" barStyle="light-content" />
      {/* Dimmed backdrop — tap to close */}
      <Pressable style={styles.modalOverlay} onPress={handleClose} />

      {/* Ticket panel — sits at the bottom, slides up */}
      <Animated.View
        style={[styles.ticketWrapper, { paddingBottom: insets.bottom + 8, transform: [{ translateY: slideAnim }] }]}
      >
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* ── Coloured header ── */}
          <View style={[styles.ticketHeader, { backgroundColor: colors.bg }]}>
            <View style={styles.ticketHeaderTop}>
              <View style={[styles.ticketLogo, { backgroundColor: colors.accent + "33" }]}>
                <Text style={[styles.ticketLogoLetter, { color: colors.accent }]}>
                  {merchantLabel(coupon.merchantId).charAt(0)}
                </Text>
              </View>
              <Text style={[styles.ticketMerchantName, { color: colors.accent }]}>
                {merchantLabel(coupon.merchantId).toUpperCase()}
              </Text>
            </View>

            <View style={styles.ticketMetaRow}>
              <View>
                <Text style={[styles.ticketMetaLabel, { color: colors.accent + "99" }]}>VALID UNTIL</Text>
                <Text style={[styles.ticketMetaValue, { color: "#fff" }]}>{formatDate(coupon.expiresAt)}</Text>
              </View>
              <View style={styles.ticketMetaSep} />
              <View>
                <Text style={[styles.ticketMetaLabel, { color: colors.accent + "99" }]}>EXPIRES AT</Text>
                <Text style={[styles.ticketMetaValue, { color: "#fff" }]}>{formatExpiresAt(coupon.expiresAt)}</Text>
              </View>
              <View style={[styles.discountPill, { backgroundColor: colors.accent }]}>
                <Text style={[styles.discountPillText, { color: colors.bg }]}>{discountLabel}</Text>
              </View>
            </View>

            {/* Serrated tear edge */}
            <View style={styles.serratedRow}>
              {Array.from({ length: 14 }).map((_, i) => (
                <View key={i} style={styles.serratedCircle} />
              ))}
            </View>
          </View>

          {/* ── White body ── */}
          <View style={styles.ticketBody}>
            <Text style={styles.ticketOfferLabel}>OFFER</Text>
            <Text style={styles.ticketHeadline}>{coupon.headline}</Text>
            <Text style={styles.ticketBodyText}>{coupon.body}</Text>

            {coupon.explanationTags?.length > 0 && (
              <View style={styles.tagsRow}>
                {coupon.explanationTags.map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: colors.light }]}>
                    <Text style={[styles.tagText, { color: colors.bg }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Dashed divider with notches */}
            <View style={styles.ticketDividerRow}>
              <View style={[styles.ticketDividerCircle, { left: -28 }]} />
              <View style={styles.ticketDividerLine} />
              <View style={[styles.ticketDividerCircle, { right: -28 }]} />
            </View>

            {/* QR code */}
            <View style={styles.qrContainer}>
              <QRCode
                value={qrValue}
                size={160}
                color="#1a1a1a"
                backgroundColor="#fff"
              />
              <Text style={styles.redemptionCode}>{code}</Text>
              <Text style={styles.qrHint}>Show this at the counter to redeem</Text>
            </View>
          </View>

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Discount badge (summary card) ───────────────────────────────────────────
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

// ─── Summary coupon card ──────────────────────────────────────────────────────
function CouponCard({ coupon }: { coupon: GeneratedCouponResponse }) {
  const [modalVisible, setModalVisible] = useState(false);
  const expiresLabel = formatExpiresAt(coupon.expiresAt);
  const colors = getMerchantColors(coupon.merchantId);

  return (
    <>
      <View style={styles.couponCard}>
        {/* Coloured top strip */}
        <View style={[styles.couponCardStrip, { backgroundColor: colors.bg }]}>
          <View style={[styles.stripLogo, { backgroundColor: colors.accent + "33" }]}>
            <Text style={[styles.stripLogoLetter, { color: colors.accent }]}>
              {merchantLabel(coupon.merchantId).charAt(0)}
            </Text>
          </View>
          <Text style={[styles.stripMerchant, { color: colors.accent }]}>
            {merchantLabel(coupon.merchantId).toUpperCase()}
          </Text>
          <DiscountBadge saving={coupon.saving} />
        </View>

        <View style={styles.couponCardBody}>
          <Text style={styles.couponHeadline}>{coupon.headline}</Text>
          <Text style={styles.couponBodyText}>{coupon.body}</Text>

          {coupon.explanationTags?.length > 0 && (
            <View style={styles.tagsRow}>
              {coupon.explanationTags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.light }]}>
                  <Text style={[styles.tagText, { color: colors.bg }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.couponFooter}>
            <View style={styles.expiryRow}>
              <Ionicons name="time-outline" size={13} color={CW.soft} />
              <Text style={styles.expiryText}>Expires {expiresLabel}</Text>
            </View>
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: colors.bg }]}
              activeOpacity={0.8}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.ctaBtnText}>{coupon.ctaLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TicketModal
        coupon={coupon}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

// ─── Empty / loading state ────────────────────────────────────────────────────
function EmptyState({ status, couponError }: { status: string; couponError: string | null }) {
  const isGenerating = status === "refreshing";
  return (
    <View style={styles.emptyState}>
      {isGenerating ? (
        <ActivityIndicator size="large" color="#2563EB" />
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

// ─── Main screen ──────────────────────────────────────────────────────────────
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CW.bgAlt },

  header: { paddingHorizontal: 22, paddingBottom: 16, paddingTop: 6 },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.8, color: CW.text, fontFamily: fontFamily.bold },
  subtitle: { fontSize: 13, color: CW.soft, marginTop: 3, fontFamily: fontFamily.regular },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },

  sectionLabel: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 2 },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#16A34A" },
  sectionLabelText: { fontSize: 12, fontWeight: "600", color: "#16A34A", fontFamily: fontFamily.semibold, textTransform: "uppercase", letterSpacing: 0.5 },

  /* Summary coupon card */
  couponCard: {
    backgroundColor: CW.bg,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  } as object,
  couponCardStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  stripLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stripLogoLetter: { fontSize: 17, fontWeight: "800", fontFamily: fontFamily.extrabold },
  stripMerchant: { flex: 1, fontSize: 12, fontWeight: "700", fontFamily: fontFamily.bold, letterSpacing: 0.5 },
  couponCardBody: { padding: 18, gap: 10 },
  couponHeadline: { fontSize: 20, fontWeight: "700", color: CW.text, fontFamily: fontFamily.bold, letterSpacing: -0.4, lineHeight: 26 },
  couponBodyText: { fontSize: 14, color: CW.soft, fontFamily: fontFamily.regular, lineHeight: 20 },

  discountBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  discountBadgeText: { color: "#fff", fontSize: 13, fontWeight: "800", fontFamily: fontFamily.extrabold },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontFamily: fontFamily.semibold },

  couponFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  expiryRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  expiryText: { fontSize: 12, color: CW.soft, fontFamily: fontFamily.regular },
  ctaBtn: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  ctaBtnText: { color: "#fff", fontSize: 14, fontWeight: "700", fontFamily: fontFamily.bold },

  /* Empty */
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 16, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: CW.text, fontFamily: fontFamily.bold, textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: CW.soft, fontFamily: fontFamily.regular, textAlign: "center", lineHeight: 20 },

  /* Modal overlay — full-screen dimmed backdrop */
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  /* Ticket panel — absolutely positioned at the bottom */
  ticketWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
  },

  /* Ticket header (coloured section) */
  ticketHeader: {
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 0,
  },
  ticketHeaderTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  ticketLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  ticketLogoLetter: { fontSize: 22, fontWeight: "900", fontFamily: fontFamily.extrabold },
  ticketMerchantName: { fontSize: 14, fontWeight: "700", fontFamily: fontFamily.bold, letterSpacing: 1 },
  ticketMetaRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  ticketMetaLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.8, fontFamily: fontFamily.bold, textTransform: "uppercase", marginBottom: 2 },
  ticketMetaValue: { fontSize: 15, fontWeight: "700", fontFamily: fontFamily.bold },
  ticketMetaSep: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },
  discountPill: {
    marginLeft: "auto",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  discountPillText: { fontSize: 13, fontWeight: "900", fontFamily: fontFamily.extrabold },

  /* Serrated tear edge */
  serratedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -24,
    marginTop: 4,
  },
  serratedCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: CW.bgAlt,
    marginTop: -8,
  },

  /* Ticket body (white section) */
  ticketBody: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8, gap: 10 },
  ticketOfferLabel: { fontSize: 10, fontWeight: "700", color: "#9CA3AF", letterSpacing: 1.2, fontFamily: fontFamily.bold },
  ticketHeadline: { fontSize: 22, fontWeight: "800", color: "#111827", fontFamily: fontFamily.extrabold, letterSpacing: -0.5, lineHeight: 28 },
  ticketBodyText: { fontSize: 14, color: "#6B7280", fontFamily: fontFamily.regular, lineHeight: 21 },

  /* Divider with notches */
  ticketDividerRow: { flexDirection: "row", alignItems: "center", marginHorizontal: -24, marginVertical: 8, position: "relative" },
  ticketDividerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: CW.bgAlt,
    position: "absolute",
    top: -10,
    zIndex: 1,
  },
  ticketDividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB", marginHorizontal: 4, borderStyle: "dashed" },

  /* QR section */
  qrContainer: { alignItems: "center", paddingVertical: 16, gap: 12 },
  redemptionCode: { fontSize: 18, fontWeight: "800", color: "#111827", fontFamily: fontFamily.extrabold, letterSpacing: 4 },
  qrHint: { fontSize: 12, color: "#9CA3AF", fontFamily: fontFamily.regular, textAlign: "center" },

  /* Close button */
  closeBtn: {
    marginHorizontal: 24,
    marginTop: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeBtnText: { fontSize: 15, fontWeight: "700", color: "#374151", fontFamily: fontFamily.bold },
});
