import { type Href, useRouter } from "expo-router";
import { useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";

import { acceptOffer } from "@/src/lib/api";
import { getLatestOffer, setLatestRedemption } from "@/src/lib/demoState";

export default function OfferDetailScreen() {
  const router = useRouter();
  const offer = getLatestOffer();
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  async function handleAcceptOffer() {
    if (!offer) return;

    setIsAccepting(true);
    setError(null);

    try {
      const redemption = await acceptOffer(offer.offer.id);
      setLatestRedemption(redemption);
      router.push(`/redeem/${redemption.token}` as Href);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not accept offer");
    } finally {
      setIsAccepting(false);
    }
  }

  if (!offer) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>No offer loaded</Text>
        <Text style={styles.body}>Generate an offer from the home screen first.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{offer.ui.headline}</Text>
      <Text style={styles.body}>{offer.ui.body}</Text>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Offer</Text>
        <Text style={styles.body}>Merchant: {offer.offer.merchant.name}</Text>
        <Text style={styles.body}>Discount: {offer.offer.discountPercent}%</Text>
        <Text style={styles.body}>Expires: {offer.offer.expiresAt}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>GenUI payload</Text>
        <Text selectable style={styles.code}>
          {JSON.stringify(offer.ui, null, 2)}
        </Text>
      </View>

      <Button
        title={isAccepting ? "Accepting..." : "Accept offer"}
        onPress={handleAcceptOffer}
        disabled={isAccepting}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  panel: {
    gap: 10,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderColor: "#DDDDDD",
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
  },
  code: {
    fontFamily: "Courier",
    fontSize: 12,
    lineHeight: 17,
  },
  error: {
    color: "#B00020",
  },
});
