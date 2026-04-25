import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/Screen";
import { demoMerchant, demoRedemption } from "@/src/data/mockData";
import { color, fontFamily, radii, shadow } from "@/src/theme/tokens";

export default function RedemptionScreen() {
  return (
    <Screen appBarTitle="Redeem">
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

      <Link href={"/merchant/dashboard" as Href} asChild>
        <Pressable style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}>
          <Text style={styles.primaryCtaText}>Simulate merchant validation</Text>
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
  eyebrow: {
    color: color.primary,
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
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
  qrPlaceholder: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: color.surfaceContainer,
    borderColor: color.primary,
    borderRadius: radii.button,
    borderWidth: 2,
    height: 220,
    justifyContent: "center",
    width: 220,
    ...shadow.soft,
  },
  qrText: {
    color: color.onSurface,
    fontFamily: fontFamily.extrabold,
    fontSize: 42,
    fontWeight: "800",
  },
  title: {
    color: color.onSurface,
    fontFamily: fontFamily.extrabold,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
    marginTop: 6,
  },
  token: {
    color: color.onSurface,
    fontFamily: fontFamily.extrabold,
    fontSize: 32,
    fontWeight: "800",
  },
  tokenBox: {
    backgroundColor: color.surfaceContainer,
    borderRadius: radii.card,
    gap: 8,
    padding: 20,
    ...shadow.soft,
  },
  tokenLabel: {
    color: color.onSurfaceVariant,
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
