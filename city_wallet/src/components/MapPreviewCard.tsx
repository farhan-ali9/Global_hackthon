import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import { useUserContextLoop } from "@/src/context-engine/UserContextLoopProvider";
import { MAP_MERCHANTS, USER_LOCATION } from "@/src/data/mockData";
import { CW, fontFamily } from "@/src/theme/tokens";

/**
 * Card-sized non-interactive map preview.
 * Tapping anywhere on it navigates to the full-screen map.
 */
export function MapPreviewCard() {
  const router = useRouter();
  const { context } = useUserContextLoop();
  const userCoordinates = context?.coordinates ?? USER_LOCATION;
  const previewRegion = {
    latitude: userCoordinates.latitude,
    longitude: userCoordinates.longitude,
    latitudeDelta: 0.018,
    longitudeDelta: 0.018,
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
      onPress={() => router.push("/map" as Href)}
      accessible
      accessibilityLabel="Open full map"
      accessibilityRole="button"
    >
      {/* ── Map (pointer-events disabled so parent Pressable handles touch) ── */}
      <View style={styles.mapContainer} pointerEvents="none">
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          region={previewRegion}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          showsTraffic={false}
          showsBuildings={false}
          showsIndoors={false}
          customMapStyle={GREY_STYLE}
          liteMode      /* Android: lighter, faster static render */
        >
          {/* User location pin */}
          <Marker
            coordinate={userCoordinates}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userDot}>
              <View style={styles.userDotInner} />
            </View>
          </Marker>

          {/* Merchant pins */}
          {MAP_MERCHANTS.map((m) => (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.latitude, longitude: m.longitude }}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={[styles.miniPin, { backgroundColor: m.brandColor }]}>
                {m.logoUrl ? (
                  <Image
                    source={{ uri: m.logoUrl }}
                    style={styles.miniPinImg}
                    contentFit="contain"
                  />
                ) : (
                  <Text style={styles.miniPinLetter}>{m.logoLetter}</Text>
                )}
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Gradient overlay top so the header floats */}
        <View style={styles.topOverlay} />
      </View>

      {/* ── Header chip (on top of map) ── */}
      <View style={styles.header} pointerEvents="none">
        <View style={styles.headerLeft}>
          <Ionicons name="map" size={14} color={CW.text} />
          <Text style={styles.headerTitle}>Nearby Merchants</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{MAP_MERCHANTS.length} offers</Text>
        </View>
      </View>

      {/* ── Bottom bar ── */}
      <View style={styles.footer} pointerEvents="none">
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
    backgroundColor: CW.bg,
    height: 210,
    ...CW.shadowCard,
  },
  pressed: { opacity: 0.93, transform: [{ scale: 0.985 }] },

  /* map */
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  map: { flex: 1 },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 52,
    backgroundColor: "rgba(252,252,252,0.88)",
  },

  /* header */
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

  /* footer */
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

  /* user location dot */
  userDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(29,115,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  userDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1D73FF",
    borderWidth: 2,
    borderColor: "#fff",
  },

  /* mini merchant pins */
  miniPin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  miniPinImg: { width: 14, height: 14 },
  miniPinLetter: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    fontFamily: fontFamily.extrabold,
  },
});

const GREY_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f0f0ee" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#888" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f0f0ee" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#999" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e8e8e8" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#d4e8f5" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#daefd8" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];
