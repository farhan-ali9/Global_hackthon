import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MapPreviewCard } from "@/src/components/MapPreviewCard";
import { useUserContextLoop } from "@/src/context-engine/UserContextLoopProvider";
import { getUserProfile } from "@/src/storage/userProfileStorage";
import { CW, fontFamily } from "@/src/theme/tokens";
import type { UserProfile } from "@/src/types/city-wallet";

const POINTS = 1_240;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { merchants, recommendation, context, status, error } = useUserContextLoop();
  const [storedProfile, setStoredProfile] = useState<UserProfile | null>(null);
  const profile = storedProfile ?? context?.profile ?? null;
  const displayName = profile?.displayName || "City Wallet user";
  const avatarInitial = useMemo(() => getAvatarInitial(displayName), [displayName]);

  useEffect(() => {
    let isMounted = true;

    getUserProfile()
      .then((nextProfile) => {
        if (isMounted) setStoredProfile(nextProfile);
      })
      .catch(() => {
        if (isMounted) setStoredProfile(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.name}>{displayName}</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{avatarInitial}</Text>
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
              <Text style={styles.statValue}>€ 0.00</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Pipeline</Text>
              <Text style={styles.statValue}>{status}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Merchants</Text>
              <Text style={styles.statValue}>{merchants.length}</Text>
            </View>
          </View>
        </View>

        {/* ── Map preview ── */}
        <MapPreviewCard />

        {/* ── Recent section ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Current Context</Text>
        </View>

        <View style={styles.empty}>
          <Text style={styles.emptyText}>City: {context?.cityId ?? "n/a"} · Zone: {context?.zoneId ?? "n/a"}</Text>
          <Text style={styles.emptyText}>Weather: {context?.weather.label ?? "n/a"} · {context?.weatherBucket ?? "n/a"}</Text>
          <Text style={styles.emptyText}>Recommended merchant: {recommendation?.merchantId ?? "none yet"}</Text>
          {error ? (
            <Text style={[styles.emptyText, { color: "#9c2a2a" }]}>{error}</Text>
          ) : (
            <Text style={styles.emptyText}>Open the Coupons tab to generate and view your coupon.</Text>
          )}
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}

function getAvatarInitial(displayName: string) {
  return displayName.trim().charAt(0).toUpperCase() || "U";
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
});
