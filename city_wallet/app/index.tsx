import { Link, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { OfferCard } from "@/src/components/OfferCard";
import { Screen } from "@/src/components/Screen";
import {
  demoCity,
  demoContextSnapshot,
  demoMerchant,
  demoOffer,
} from "@/src/data/mockData";

export default function Index() {
  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>City Wallet</Text>
        <Text style={styles.title}>One relevant offer, right now.</Text>
        <Text style={styles.subtitle}>
          {demoCity.name} · {demoContextSnapshot.weather} ·{" "}
          {demoContextSnapshot.temperatureCelsius} C
        </Text>
      </View>

      <OfferCard offer={demoOffer} merchant={demoMerchant} />

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Current context</Text>
        <Text style={styles.body}>{demoContextSnapshot.locationLabel}</Text>
        <Text style={styles.body}>{demoContextSnapshot.demandSignal}</Text>
      </View>

      <Link href={"/merchant/dashboard" as Href} style={styles.secondaryLink}>
        Open merchant view
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
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 42,
    marginTop: 6,
  },
  subtitle: {
    color: "#75695D",
    fontSize: 16,
    marginTop: 8,
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
  secondaryLink: {
    color: "#7C3F1D",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
});
