import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COUPONS } from "@/src/data/mockData";
import type { Coupon } from "@/src/types/city-wallet";
import { fontFamily } from "@/src/theme/tokens";

/* ── Pseudo QR code generator ── */
const GRID = 21;

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

function isFinderCell(r: number, c: number): boolean | null {
  // Returns true=dark, false=light, null=not in finder zone
  const inTL = r < 7 && c < 7;
  const inTR = r < 7 && c >= GRID - 7;
  const inBL = r >= GRID - 7 && c < 7;
  if (!inTL && !inTR && !inBL) return null;
  const lr = inTR ? r : inBL ? r - (GRID - 7) : r;
  const lc = inTR ? c - (GRID - 7) : c;
  if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
  if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
  return false;
}

function buildQR(token: string): boolean[][] {
  const h = hashCode(token);
  const grid: boolean[][] = [];
  for (let r = 0; r < GRID; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID; c++) {
      const f = isFinderCell(r, c);
      if (f !== null) {
        grid[r][c] = f;
      } else {
        // Separator rows/cols around finders → always light
        const sepR = r === 7 || r === GRID - 8;
        const sepC = c === 7 || c === GRID - 8;
        const nearTL = r <= 8 && c <= 8;
        const nearTR = r <= 8 && c >= GRID - 9;
        const nearBL = r >= GRID - 9 && c <= 8;
        if ((sepR || sepC) && (nearTL || nearTR || nearBL)) {
          grid[r][c] = false;
        } else {
          const idx = r * GRID + c;
          grid[r][c] = ((h * (idx + 1) + idx * idx * 7) % 5) < 2;
        }
      }
    }
  }
  return grid;
}

function QRCodeView({ token, size = 200 }: { token: string; size?: number }) {
  const grid = useMemo(() => buildQR(token), [token]);
  const cell = size / GRID;
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {grid.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <View
              key={`${r}-${c}`}
              style={{
                position: "absolute",
                left: c * cell,
                top: r * cell,
                width: cell,
                height: cell,
                backgroundColor: "#000",
                borderRadius: cell * 0.15,
              }}
            />
          ) : null
        )
      )}
    </View>
  );
}

/* ── Coupon detail screen ── */
export default function CouponDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const coupon: Coupon | undefined =
    COUPONS.find((c) => c.id === id);

  if (!coupon) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Coupon not found.</Text>
      </View>
    );
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={[styles.root, { backgroundColor: coupon.brandColor }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.9)" />
          </Pressable>
          <View style={styles.brandRow}>
            <View style={[styles.logoCircle, { backgroundColor: coupon.accentColor }]}>
              <Text style={styles.logoLetter}>{coupon.logoLetter}</Text>
            </View>
            <Text style={styles.companyName}>{coupon.company.toUpperCase()}</Text>
          </View>
          <View style={styles.dateBlock}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>DATE</Text>
              <Text style={styles.dateValue}>{dateStr}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>TIME</Text>
              <Text style={styles.dateValue}>{timeStr}</Text>
            </View>
          </View>
        </View>

        {/* ── Ticket body ── */}
        <View style={styles.ticketBody}>
          {/* Offer name */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>OFFER</Text>
            <Text style={styles.offerTitle}>
              {coupon.offer} — {coupon.offerDetail}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>LOCATION</Text>
            <Text style={styles.fieldValue}>{coupon.location}</Text>
          </View>

          {/* Info row */}
          <View style={styles.infoRow}>
            <View style={styles.infoCell}>
              <Text style={styles.fieldLabel}>TYPE</Text>
              <Text style={styles.fieldValue}>{coupon.category.toUpperCase()}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.fieldLabel}>VALID UNTIL</Text>
              <Text style={styles.fieldValue}>{coupon.validUntil}</Text>
            </View>
            {coupon.savings && (
              <View style={styles.infoCell}>
                <Text style={styles.fieldLabel}>SAVINGS</Text>
                <Text style={[styles.fieldValue, { color: "#27AE60" }]}>{coupon.savings}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Perforated separator ── */}
        <View style={styles.perf}>
          <View style={styles.perfCircleL} />
          <View style={styles.dashes}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={i} style={styles.dash} />
            ))}
          </View>
          <View style={styles.perfCircleR} />
        </View>

        {/* ── QR section ── */}
        <View style={styles.qrSection}>
          <View style={styles.qrCard}>
            <QRCodeView token={coupon.token} size={190} />
          </View>
          <Text style={styles.tokenText}>{coupon.token}</Text>
          <Text style={styles.scanHint}>Show this QR code at the store</Text>
        </View>

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24 },

  /* top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    gap: 0,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  brandRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoLetter: { fontSize: 17, fontWeight: "800", color: "#fff", fontFamily: fontFamily.extrabold },
  companyName: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 1.2,
    fontFamily: fontFamily.bold,
  },
  dateBlock: { flexDirection: "row", gap: 14, alignItems: "flex-end" },
  dateItem: { alignItems: "flex-end" },
  dateLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: fontFamily.semibold,
  },
  dateValue: { fontSize: 12, color: "#fff", fontWeight: "600", fontFamily: fontFamily.bold, marginTop: 2 },

  /* ticket body */
  ticketBody: { gap: 20 },
  section: { gap: 4 },
  infoRow: { flexDirection: "row", gap: 24 },
  infoCell: { gap: 4 },
  fieldLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: fontFamily.semibold,
    fontWeight: "600",
  },
  fieldValue: { fontSize: 14, color: "#fff", fontWeight: "600", fontFamily: fontFamily.semibold },
  offerTitle: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 32,
    fontFamily: fontFamily.extrabold,
  },

  /* perforation */
  perf: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 28,
    position: "relative",
  },
  perfCircleL: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.18)",
    marginLeft: -24,
    flexShrink: 0,
  },
  perfCircleR: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.18)",
    marginRight: -24,
    flexShrink: 0,
  },
  dashes: { flex: 1, flexDirection: "row", paddingHorizontal: 4, gap: 4 },
  dash: { flex: 1, height: 1.5, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 1 },

  /* QR */
  qrSection: { alignItems: "center", gap: 16 },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    ...({
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 10,
    } as object),
  },
  tokenText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 3,
    fontFamily: fontFamily.bold,
  },
  scanHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
});
