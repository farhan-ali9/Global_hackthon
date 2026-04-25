import { Link, type Href, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/Screen";
import { demoContextSnapshot, demoMerchant, demoOffer } from "@/src/data/mockData";

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>Generated offer</Text>
        <Text style={styles.title}>{demoOffer.title}</Text>
        <Text style={styles.subtitle}>{demoMerchant.name}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.hook}>{demoOffer.hook}</Text>
        <Text style={styles.discount}>{demoOffer.discountPercent}% off</Text>
        <Text style={styles.body}>{demoOffer.reason}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Context snapshot</Text>
        <Text style={styles.body}>
          {demoContextSnapshot.weather}, {demoContextSnapshot.temperatureCelsius} C,
          {` ${demoContextSnapshot.timeOfDay}`}
        </Text>
        <Text style={styles.body}>{demoContextSnapshot.demandSignal}</Text>
      </View>

      <Link
        href={`/redeem/${id ?? demoOffer.id}` as Href}
        style={styles.primaryLink}
      >
        Accept and redeem
      </Link>
      <Link href={"/merchant/dashboard" as Href} style={styles.secondaryLink}>
        Open merchant dashboard
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
  panel: {
    gap: 10,
    padding: 18,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E1D4",
    borderWidth: 1,
  },
  hook: {
    color: "#1F1A16",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },
  discount: {
    color: "#0E6E55",
    fontSize: 30,
    fontWeight: "900",
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
