import { Link, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { MetricCard } from "@/src/components/MetricCard";
import { Screen } from "@/src/components/Screen";
import { demoMerchant, demoOffer } from "@/src/data/mockData";

export default function MerchantDashboardScreen() {
  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>Merchant view</Text>
        <Text style={styles.title}>{demoMerchant.name}</Text>
        <Text style={styles.subtitle}>Offer performance mock dashboard</Text>
      </View>

      <View style={styles.metricGrid}>
        <MetricCard label="Generated" value="42" />
        <MetricCard label="Accepted" value="18" />
        <MetricCard label="Redeemed" value="11" />
        <MetricCard label="Conversion" value="26%" />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Active generated offer</Text>
        <Text style={styles.body}>
          {demoOffer.discountPercent}% off generated for quiet demand and nearby cold
          weather context.
        </Text>
      </View>

      <Link href={"/merchant/rules" as Href} style={styles.primaryLink}>
        Edit merchant rules
      </Link>
      <Link href="/" style={styles.secondaryLink}>
        Back to consumer wallet
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: "#7C3F1D",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: "#1F1A16",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 6,
  },
  subtitle: {
    color: "#75695D",
    fontSize: 16,
    marginTop: 4,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  panel: {
    gap: 8,
    padding: 18,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E1D4",
    borderWidth: 1,
  },
  sectionTitle: {
    color: "#1F1A16",
    fontSize: 17,
    fontWeight: "800",
  },
  body: {
    color: "#4F463E",
    fontSize: 15,
    lineHeight: 22,
  },
  primaryLink: {
    backgroundColor: "#1F1A16",
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    overflow: "hidden",
    padding: 16,
    textAlign: "center",
  },
  secondaryLink: {
    color: "#7C3F1D",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
});
