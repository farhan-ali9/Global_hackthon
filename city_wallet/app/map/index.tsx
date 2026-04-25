import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Callout, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUserContextLoop } from "@/src/context-engine/UserContextLoopProvider";
import { MAP_MERCHANTS, USER_LOCATION, type MapMerchant } from "@/src/data/mockData";
import { CW, fontFamily } from "@/src/theme/tokens";

export default function FullMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const hasCenteredLiveLocationRef = useRef(false);
  const { context } = useUserContextLoop();

  const [selected, setSelected] = useState<MapMerchant | null>(null);
  const userCoordinates = context?.coordinates ?? USER_LOCATION;
  const userRegion = useMemo(
    () => ({
      latitude: userCoordinates.latitude,
      longitude: userCoordinates.longitude,
      latitudeDelta: 0.025,
      longitudeDelta: 0.025,
    }),
    [userCoordinates.latitude, userCoordinates.longitude],
  );

  useEffect(() => {
    if (context === null || hasCenteredLiveLocationRef.current) return;

    hasCenteredLiveLocationRef.current = true;
    mapRef.current?.animateToRegion(userRegion, 600);
  }, [context, userRegion]);

  function focusUser() {
    mapRef.current?.animateToRegion(
      { ...userCoordinates, latitudeDelta: 0.015, longitudeDelta: 0.015 },
      600,
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Map ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={userRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={MAP_STYLE}
      >
        <Marker coordinate={userCoordinates} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.userDot}>
            <View style={styles.userDotInner} />
          </View>
        </Marker>

        {/* Merchant markers */}
        {MAP_MERCHANTS.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            onPress={() => setSelected(m)}
          >
            {/* Custom pin */}
            <View style={[styles.pin, { backgroundColor: m.brandColor }]}>
              {m.logoUrl ? (
                <Image
                  source={{ uri: m.logoUrl }}
                  style={styles.pinLogo}
                  contentFit="contain"
                />
              ) : (
                <Text style={styles.pinLetter}>{m.logoLetter}</Text>
              )}
            </View>
            <View style={[styles.pinTail, { borderTopColor: m.brandColor }]} />
            <Callout tooltip>
              <View />
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={CW.text} />
        </Pressable>

        <View style={styles.titleBox}>
          <Text style={styles.title}>Nearby Merchants</Text>
          <Text style={styles.subtitle}>{MAP_MERCHANTS.length} offers available</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
          onPress={focusUser}
        >
          <Ionicons name="locate" size={20} color={CW.text} />
        </Pressable>
      </View>

      {/* ── Bottom merchant card (appears when marker tapped) ── */}
      {selected && (
        <View style={[styles.merchantCard, { paddingBottom: insets.bottom + 12 }]}>
          {/* close */}
          <Pressable
            style={styles.closeBtn}
            onPress={() => setSelected(null)}
          >
            <Ionicons name="close" size={18} color={CW.soft} />
          </Pressable>

          <View style={styles.merchantRow}>
            {/* Logo */}
            <View style={[styles.merchantLogo, { backgroundColor: selected.brandColor }]}>
              {selected.logoUrl ? (
                <Image
                  source={{ uri: selected.logoUrl }}
                  style={styles.merchantLogoImg}
                  contentFit="contain"
                />
              ) : (
                <Text style={styles.merchantLogoLetter}>{selected.logoLetter}</Text>
              )}
            </View>

            <View style={styles.merchantInfo}>
              <Text style={styles.merchantName}>{selected.name}</Text>
              <Text style={styles.merchantCategory}>{selected.category}</Text>
            </View>

            <View style={[styles.offerBadge, { backgroundColor: selected.brandColor + "18" }]}>
              <Text style={[styles.offerText, { color: selected.brandColor }]}>
                {selected.offer}
              </Text>
            </View>
          </View>

          {/* Distance */}
          <View style={styles.distRow}>
            <Ionicons name="location-outline" size={13} color={CW.soft} />
            <Text style={styles.distText}>
              {getDistanceMeters(
                userCoordinates.latitude,
                userCoordinates.longitude,
                selected.latitude,
                selected.longitude,
              )}{" "}
              m away
            </Text>
          </View>
        </View>
      )}

      {/* ── Locate-me FAB (bottom-right) ── */}
      {!selected && (
        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={focusUser}
        >
          <Ionicons name="locate" size={22} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

/** Haversine approximation → returns rounded metres */
function getDistanceMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CW.bg },

  map: { ...StyleSheet.absoluteFillObject },

  /* top bar */
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 10,
    backgroundColor: "rgba(252,252,252,0.92)",
    borderBottomWidth: 1,
    borderBottomColor: CW.border,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: CW.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: CW.border,
  },
  titleBox: { flex: 1, alignItems: "center" },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: CW.text,
    fontFamily: fontFamily.semibold,
  },
  subtitle: {
    fontSize: 11,
    color: CW.soft,
    marginTop: 1,
    fontFamily: fontFamily.regular,
  },

  /* custom marker */
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    overflow: "hidden",
  },
  pinLogo: { width: 22, height: 22 },
  pinLetter: { fontSize: 15, fontWeight: "800", color: "#fff", fontFamily: fontFamily.extrabold },
  pinTail: {
    width: 0,
    height: 0,
    alignSelf: "center",
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },
  userDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(29,115,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  userDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1D73FF",
    borderWidth: 2,
    borderColor: "#fff",
  },

  /* bottom merchant card */
  merchantCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CW.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 16,
    padding: 4,
  },
  merchantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
  },
  merchantLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  merchantLogoImg: { width: 30, height: 30 },
  merchantLogoLetter: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    fontFamily: fontFamily.extrabold,
  },
  merchantInfo: { flex: 1 },
  merchantName: {
    fontSize: 16,
    fontWeight: "600",
    color: CW.text,
    fontFamily: fontFamily.semibold,
  },
  merchantCategory: {
    fontSize: 12,
    color: CW.soft,
    marginTop: 2,
    textTransform: "capitalize",
    fontFamily: fontFamily.regular,
  },
  offerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  offerText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: fontFamily.bold,
  },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  distText: {
    fontSize: 12,
    color: CW.soft,
    fontFamily: fontFamily.regular,
  },

  /* fab */
  fab: {
    position: "absolute",
    right: 18,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: CW.text,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
});

/** Subtle grey map style for a clean look */
const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5f5e5" }] },
];
