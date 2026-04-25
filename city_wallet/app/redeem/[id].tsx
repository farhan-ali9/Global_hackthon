import { Link, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/Screen";
import { demoMerchant, demoRedemption } from "@/src/data/mockData";

export default function RedemptionScreen() {
  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>Redemption</Text>
        <Text style={styles.title}>Show this token at {demoMerchant.name}</Text>
      </View>

      <View style={styles.qrPlaceholder}>
        <Text style={styles.qrText}>QR</Text>
      </View>

      <View style={styles.tokenBox}>
        <Text style={styles.tokenLabel}>Token</Text>
        <Text style={styles.token}>{demoRedemption.token}</Text>
        <Text style={styles.body}>
          Placeholder for QR/token validation. Backend can connect this to Firestore
          redemption status later.
        </Text>
      </View>

      <Link href={"/merchant/dashboard" as Href} style={styles.primaryLink}>
        Simulate merchant validation
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
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
    marginTop: 6,
  },
  qrPlaceholder: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#1F1A16",
    borderRadius: 8,
    borderWidth: 2,
    height: 220,
    justifyContent: "center",
    width: 220,
  },
  qrText: {
    color: "#1F1A16",
    fontSize: 42,
    fontWeight: "900",
  },
  tokenBox: {
    gap: 8,
    padding: 18,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E1D4",
    borderWidth: 1,
  },
  tokenLabel: {
    color: "#75695D",
    fontSize: 13,
    fontWeight: "700",
  },
  token: {
    color: "#1F1A16",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0,
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
});
