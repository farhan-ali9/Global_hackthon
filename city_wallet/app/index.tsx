import { Link, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";

import { mockContextProvider } from "@/src/context-engine/ContextProvider";
import { generateOffer } from "@/src/lib/api";
import { setLatestOffer } from "@/src/lib/demoState";
import type {
  AnonymizedContextPayload,
  GeneratedOfferResponse,
} from "@/src/types/city-wallet";

export default function Index() {
  const [context, setContext] = useState<AnonymizedContextPayload | null>(null);
  const [offer, setOffer] = useState<GeneratedOfferResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    mockContextProvider.getAnonymizedContext().then(setContext).catch((reason) => {
      setError(reason instanceof Error ? reason.message : "Could not load context");
    });
  }, []);

  async function handleGenerateOffer() {
    if (!context) return;

    setIsLoading(true);
    setError(null);

    try {
      const generatedOffer = await generateOffer(context);
      setLatestOffer(generatedOffer);
      setOffer(generatedOffer);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not generate offer");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>City Wallet</Text>
      <Text style={styles.body}>
        Send anonymized context to the backend and render the returned GenUI
        offer payload.
      </Text>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Anonymized context</Text>
        <Text selectable style={styles.code}>
          {context ? JSON.stringify(context, null, 2) : "Loading context..."}
        </Text>
      </View>

      <Button
        title={isLoading ? "Generating..." : "Generate offer"}
        onPress={handleGenerateOffer}
        disabled={!context || isLoading}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {offer ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Returned offer</Text>
          <Text style={styles.body}>
            {offer.ui.headline} · {offer.offer.discountPercent}% off at{" "}
            {offer.offer.merchant.name}
          </Text>
          <Text selectable style={styles.code}>
            {JSON.stringify(offer.ui, null, 2)}
          </Text>
          <Link href={`/offers/${offer.offer.id}` as Href} style={styles.link}>
            Open offer
          </Link>
        </View>
      ) : null}
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
    gap: 8,
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
  link: {
    color: "#0057CC",
    fontSize: 15,
    fontWeight: "700",
  },
});
