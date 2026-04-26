import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUserContextLoop } from "@/src/context-engine/UserContextLoopProvider";
import type { MerchantSummary } from "@/src/types/city-wallet";
import { CW, fontFamily } from "@/src/theme/tokens";

function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

function MerchantCard({
  merchant,
  distanceMeters,
  isRecommended,
}: {
  merchant: MerchantSummary;
  distanceMeters: number;
  isRecommended: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>M</Text>
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.companyName}>{merchant.id.replace("merchant-", "").replaceAll("-", " ")}</Text>
          <View style={styles.distRow}>
            <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.7)" />
            <Text style={styles.distance}>{formatDistance(distanceMeters)} away</Text>
          </View>
        </View>
        <View style={styles.offerBadge}>
          <Text style={styles.offerBadgeText}>{isRecommended ? "Recommended" : "Candidate"}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.offerDetail}>{merchant.description}</Text>
        <Text style={styles.metaText}>Offer generation disabled for now.</Text>
      </View>
    </View>
  );
}

export default function CouponsScreen() {
  const insets = useSafeAreaInsets();
  const { context, merchants, recommendation, status, error } = useUserContextLoop();
  const merchantsWithDistance = merchants
    .map((merchant) => ({
      merchant,
      distanceMeters: getDistanceMeters(
        context?.coordinates.latitude ?? merchant.coordinates.latitude,
        context?.coordinates.longitude ?? merchant.coordinates.longitude,
        merchant.coordinates.latitude,
        merchant.coordinates.longitude,
      ),
    }))
    .sort((left, right) => left.distanceMeters - right.distanceMeters);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Merchant Pipeline</Text>
          <Text style={styles.subtitle}>Context + merchant ranking (no offer generation)</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{merchants.length}</Text>
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
          <Text style={styles.statusBody}>Recommended merchant: {recommendation?.merchantId ?? "none yet"}</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
        {merchantsWithDistance.map(({ merchant, distanceMeters }) => (
          <MerchantCard
            key={merchant.id}
            merchant={merchant}
            distanceMeters={distanceMeters}
            isRecommended={recommendation?.merchantId === merchant.id}
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
    backgroundColor: CW.text,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: "rgba(255,255,255,0.2)",
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
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  offerBadgeText: { fontSize: 11, fontWeight: "800", fontFamily: fontFamily.extrabold, color: "#fff" },

  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  offerDetail: { fontSize: 14, fontWeight: "600", color: CW.text, fontFamily: fontFamily.bold },
  metaText: { fontSize: 11, color: CW.soft, fontFamily: fontFamily.regular, flex: 1 },
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
  errorText: { color: "#9c2a2a", fontFamily: fontFamily.medium, fontSize: 12 },
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
