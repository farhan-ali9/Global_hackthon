import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/Screen";
import { demoRule } from "@/src/data/mockData";
import { color, fontFamily, radii, shadow } from "@/src/theme/tokens";

export default function MerchantRulesScreen() {
  return (
    <Screen appBarTitle="Rules">
      <View>
        <Text style={styles.eyebrow}>Merchant rules</Text>
        <Text style={styles.title}>Campaign guardrails</Text>
        <Text style={styles.subtitle}>Mock rule interface for the generative engine</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.label}>Goal</Text>
        <Text style={styles.value}>{demoRule.goal}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.label}>Maximum discount</Text>
        <Text style={styles.value}>{demoRule.maxDiscountPercent}%</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.label}>Quiet hours</Text>
        <Text style={styles.value}>{demoRule.quietHours}</Text>
      </View>

      <Text style={styles.note}>
        Backend and merchant teams can replace these static values with editable
        Firestore-backed forms.
      </Text>

      <Link href={"/merchant/dashboard" as Href} asChild>
        <Pressable style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}>
          <Text style={styles.primaryCtaText}>Back to dashboard</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: color.primary,
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  label: {
    color: color.onSurfaceVariant,
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  note: {
    color: color.secondary,
    fontFamily: fontFamily.medium,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 24,
  },
  panel: {
    backgroundColor: color.surfaceContainer,
    borderRadius: radii.card,
    gap: 6,
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
  subtitle: {
    color: color.secondary,
    fontFamily: fontFamily.medium,
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
  },
  title: {
    color: color.onSurface,
    fontFamily: fontFamily.extrabold,
    fontSize: 30,
    fontWeight: "800",
    marginTop: 6,
  },
  value: {
    color: color.onSurface,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 25,
  },
});
