import { Image } from "expo-image";
import { Link, type Href } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import type { GeneratedOffer, Merchant } from "@/src/types/city-wallet";
import { color, fontFamily, radii, shadow, space, webGlassStyle } from "@/src/theme/tokens";

const DEMO_HERO =
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&q=85";

type OfferCardProps = {
  offer: GeneratedOffer;
  merchant: Merchant;
};

export function OfferCard({ offer, merchant }: OfferCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Image
          accessibilityLabel={`${merchant.name} offer image`}
          contentFit="cover"
          source={{ uri: DEMO_HERO }}
          style={styles.image}
        />
        <View
          style={[
            styles.glassTag,
            Platform.OS === "web" ? webGlassStyle() : { backgroundColor: "rgba(255,255,255,0.82)" },
          ]}
        >
          <Text style={styles.glassTagText}>{offer.discountPercent}% OFF</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.merchant}>{merchant.name}</Text>
          <Text style={styles.distance}>{merchant.distanceMeters} m</Text>
        </View>
        <Text style={styles.title}>{offer.title}</Text>
        <Text style={styles.hook}>{offer.hook}</Text>

        <Link href={`/offers/${offer.id}` as Href} asChild>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Text style={styles.ctaText}>View offer</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 12,
    paddingBottom: 20,
    paddingHorizontal: space.cardPadding,
    paddingTop: 18,
  },
  card: {
    backgroundColor: color.surfaceContainer,
    borderRadius: radii.card,
    ...shadow.deep,
    overflow: "hidden",
    width: "100%",
  },
  cta: {
    alignItems: "center",
    backgroundColor: color.primary,
    borderRadius: radii.button,
    marginTop: 4,
    paddingVertical: 14,
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    color: "#FFFFFF",
    fontFamily: fontFamily.bold,
    fontSize: 16,
    fontWeight: "700",
  },
  distance: {
    color: color.onSurfaceVariant,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    fontWeight: "500",
  },
  glassTag: {
    borderRadius: radii.sm,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
    top: 12,
  },
  glassTagText: {
    color: color.onSurface,
    fontFamily: fontFamily.extrabold,
    fontSize: 12,
    fontWeight: "800",
  },
  hook: {
    color: color.secondary,
    fontFamily: fontFamily.medium,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  imageWrap: {
    aspectRatio: 1.5,
    position: "relative",
    width: "100%",
  },
  merchant: {
    color: color.onSurface,
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    fontWeight: "600",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: color.onSurface,
    fontFamily: fontFamily.extrabold,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
});
