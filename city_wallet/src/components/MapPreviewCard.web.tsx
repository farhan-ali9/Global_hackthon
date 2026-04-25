/**
 * Web-only fallback for MapPreviewCard.
 * Uses a free OpenStreetMap static image — no API key needed.
 * Metro/webpack automatically picks this file on web builds
 * and MapPreviewCard.tsx on iOS/Android.
 */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MAP_MERCHANTS, USER_LOCATION } from "@/src/data/mockData";
import { CW, fontFamily } from "@/src/theme/tokens";

const { latitude: lat, longitude: lon } = USER_LOCATION;

// Free static map tiles — no key required
const STATIC_MAP = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=15&size=640x360`;

export function MapPreviewCard() {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
      onPress={() => router.push("/map" as Href)}
      accessible
      accessibilityLabel="Open full map"
      accessibilityRole="button"
    >
      {/* Static map image */}
      <Image
        source={{ uri: STATIC_MAP }}
        style={styles.mapImage}
        contentFit="cover"
        transition={300}
      />

      {/* Semi-transparent top bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="map" size={14} color={CW.text} />
          <Text style={styles.headerTitle}>Nearby Merchants</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{MAP_MERCHANTS.length} offers</Text>
        </View>
      </View>

      {/* Bottom bar */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap to explore</Text>
        <Ionicons name="chevron-forward" size={14} color={CW.soft} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: CW.r,
    overflow: "hidden",
    height: 210,
    backgroundColor: "#e8e8e6",
    ...CW.shadowCard,
  },
  pressed: { opacity: 0.93, transform: [{ scale: 0.985 }] },

  mapImage: {
    ...StyleSheet.absoluteFillObject,
  },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(252,252,252,0.88)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: CW.text,
    fontFamily: fontFamily.semibold,
  },
  countBadge: {
    backgroundColor: CW.text,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 11,
    color: "#fff",
    fontFamily: fontFamily.semibold,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(252,252,252,0.92)",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: CW.border,
  },
  footerText: {
    fontSize: 12,
    color: CW.soft,
    fontFamily: fontFamily.regular,
  },
});
