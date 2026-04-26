import { Link, type Href, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/Screen";
import { useUserContextLoop } from "@/src/context-engine/UserContextLoopProvider";
import { color, fontFamily, radii, shadow } from "@/src/theme/tokens";

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recommendation, context } = useUserContextLoop();

  return (
    <Screen appBarTitle="Offer">
      <View>
        <Text style={styles.eyebrow}>Generated offer</Text>
        <Text style={styles.title}>Generation disabled</Text>
        <Text style={styles.subtitle}>{recommendation?.merchantId ?? "No merchant recommended yet"}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.hook}>Pipeline currently stops before coupon creation.</Text>
        <Text style={styles.discount}>0% off</Text>
        <Text style={styles.body}>This screen remains as a placeholder until offer generation is enabled.</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Context snapshot</Text>
        <Text style={styles.body}>
          {context?.weather.label ?? "n/a"}, {context?.weather.temperatureCelsius ?? "n/a"} C,{" "}
          {context?.timeOfDay ?? "n/a"}
        </Text>
        <Text style={styles.body}>Demand tags: {context?.demandTags.join(", ") ?? "n/a"}</Text>
      </View>

      <Link href={`/redeem/${id ?? "pending"}` as Href} asChild>
        <Pressable style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}>
          <Text style={styles.primaryCtaText}>Accept and redeem</Text>
        </Pressable>
      </Link>
      <Link href={"/merchant/dashboard" as Href} asChild>
        <Pressable style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>Open merchant dashboard</Text>
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
  discount: {
    color: color.success,
    fontFamily: fontFamily.extrabold,
    fontSize: 32,
    fontWeight: "800",
  },
  eyebrow: {
    color: color.primary,
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  hook: {
    color: color.onSurface,
    fontFamily: fontFamily.bold,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },
  panel: {
    backgroundColor: color.surfaceContainer,
    borderRadius: radii.card,
    gap: 10,
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
  sectionTitle: {
    color: color.onSurface,
    fontFamily: fontFamily.bold,
    fontSize: 17,
    fontWeight: "700",
  },
  secondary: { alignItems: "center", paddingVertical: 8 },
  secondaryText: {
    color: color.primary,
    fontFamily: fontFamily.bold,
    fontSize: 15,
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
});
