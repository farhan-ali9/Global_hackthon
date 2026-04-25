import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";

import { getRedemption, validateRedemption } from "@/src/lib/api";
import {
  getLatestRedemption,
  setLatestRedemption,
} from "@/src/lib/demoState";
import type { RedemptionResponse } from "@/src/types/city-wallet";

export default function RedemptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = id ?? getLatestRedemption()?.token;
  const [redemption, setRedemption] = useState<RedemptionResponse | null>(
    getLatestRedemption(),
  );
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!token) return;

    getRedemption(token)
      .then((latest) => {
        setLatestRedemption(latest);
        setRedemption(latest);
      })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Could not load token");
      });
  }, [token]);

  async function handleValidate() {
    if (!token) return;

    setIsValidating(true);
    setError(null);

    try {
      const latest = await validateRedemption(token);
      setLatestRedemption(latest);
      setRedemption(latest);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not validate token");
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Redemption</Text>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Token</Text>
        <Text selectable style={styles.token}>
          {token ?? "No token"}
        </Text>
        <Text style={styles.body}>Status: {redemption?.status ?? "loading"}</Text>
        <Text style={styles.body}>Expires: {redemption?.expiresAt ?? "unknown"}</Text>
      </View>

      <Button
        title={isValidating ? "Validating..." : "Validate redemption"}
        onPress={handleValidate}
        disabled={!token || isValidating}
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
  token: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
  },
  error: {
    color: "#B00020",
  },
});
