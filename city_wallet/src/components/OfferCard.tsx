import { Link, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import type { GeneratedOffer, Merchant } from "@/src/types/city-wallet";

type OfferCardProps = {
  offer: GeneratedOffer;
  merchant: Merchant;
};

export function OfferCard({ offer, merchant }: OfferCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.merchant}>{merchant.name}</Text>
        <Text style={styles.distance}>{merchant.distanceMeters} m</Text>
      </View>
      <Text style={styles.title}>{offer.title}</Text>
      <Text style={styles.hook}>{offer.hook}</Text>
      <View style={styles.footer}>
        <Text style={styles.discount}>{offer.discountPercent}% off</Text>
        <Link href={`/offers/${offer.id}` as Href} style={styles.link}>
          View offer
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 18,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E1D4",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  merchant: {
    color: "#4D4034",
    fontSize: 15,
    fontWeight: "700",
  },
  distance: {
    color: "#75695D",
    fontSize: 13,
  },
  title: {
    color: "#1F1A16",
    fontSize: 28,
    fontWeight: "800",
  },
  hook: {
    color: "#4F463E",
    fontSize: 16,
    lineHeight: 23,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  discount: {
    color: "#0E6E55",
    fontSize: 18,
    fontWeight: "800",
  },
  link: {
    color: "#7C3F1D",
    fontSize: 15,
    fontWeight: "700",
  },
});
