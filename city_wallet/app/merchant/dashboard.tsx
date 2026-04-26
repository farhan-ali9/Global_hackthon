import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MetricCard } from "@/src/components/MetricCard";
import { ProgressBar } from "@/src/components/ProgressBar";
import { Screen } from "@/src/components/Screen";
import { useUserContextLoop } from "@/src/context-engine/UserContextLoopProvider";
import { color, fontFamily, radii, shadow } from "@/src/theme/tokens";

export default function MerchantDashboardScreen() {
  const { merchants, recommendation } = useUserContextLoop();
  return (
    <Screen appBarTitle="Merchant">
      <View>
        <Text style={styles.eyebrow}>Merchant view</Text>
        <Text style={styles.title}>{recommendation?.merchantId ?? "No merchant selected yet"}</Text>
        <Text style={styles.subtitle}>Pre-offer pipeline dashboard</Text>
      </View>

      <View style={styles.metricGrid}>
        <MetricCard label="Merchants" value={String(merchants.length)} />
        <MetricCard label="Generated" value="0" />
        <MetricCard label="Accepted" value="0" />
        <MetricCard label="Redeemed" value="0" />
      </View>

      <View style={styles.panel}>
        <Text style={styles.systemLabel}>Funnel (accepted → redeemed)</Text>
        <ProgressBar value={0} />
        <Text style={styles.caption}>
          Funnel tracking will start once offer generation is enabled.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Active generated offer</Text>
        <Text style={styles.body}>
          No active offer yet. Merchant recommendation is available, but generation is paused.
        </Text>
      </View>

      <Link href={"/merchant/rules" as Href} asChild>
        <Pressable style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}>
          <Text style={styles.primaryCtaText}>Edit merchant rules</Text>
        </Pressable>
      </Link>
      <Link href="/" asChild>
        <Pressable style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>Back to consumer wallet</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: color.secondary,
    fontFamily: fontFamily.medium,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 24,
  },
  caption: {
    color: color.onSurfaceVariant,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 8,
  },
  eyebrow: {
    color: color.primary,
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  panel: {
    backgroundColor: color.surfaceContainer,
    borderRadius: radii.card,
    gap: 8,
    padding: 20,
    ...shadow.soft,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  primaryCta: {
    alignItems: "center",
    backgroundColor: color.primary,
    borderRadius: radii.button,
    marginTop: 4,
    paddingVertical: 16,
  },
  primaryCtaText: {
    color: "#FFFFFF",
    fontFamily: fontFamily.bold,
    fontSize: 16,
    fontWeight: "700",
  },
  secondary: { alignItems: "center", paddingVertical: 8 },
  secondaryText: {
    color: color.primary,
    fontFamily: fontFamily.bold,
    fontSize: 15,
    fontWeight: "700",
  },
  sectionTitle: {
    color: color.onSurface,
    fontFamily: fontFamily.bold,
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    color: color.secondary,
    fontFamily: fontFamily.medium,
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
  },
  systemLabel: {
    color: color.onSurfaceVariant,
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: color.onSurface,
    fontFamily: fontFamily.extrabold,
    fontSize: 30,
    fontWeight: "800",
    marginTop: 6,
  },
});
