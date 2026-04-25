/**
 * Web-only full-screen map using an OpenStreetMap iframe.
 * No API key needed. Picked up automatically instead of index.tsx on web.
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MAP_MERCHANTS, USER_LOCATION } from "@/src/data/mockData";
import { CW, fontFamily } from "@/src/theme/tokens";

const { latitude: lat, longitude: lon } = USER_LOCATION;

// Bounding box: ~1.5 km around Marienplatz
const EMBED_SRC =
  `https://www.openstreetmap.org/export/embed.html` +
  `?bbox=${lon - 0.018},${lat - 0.012},${lon + 0.018},${lat + 0.012}` +
  `&layer=mapnik` +
  `&marker=${lat},${lon}`;

export default function FullMapScreenWeb() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* Top bar */}
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

        {/* spacer to balance layout */}
        <View style={styles.iconBtn} />
      </View>

      {/* OpenStreetMap iframe — valid on web */}
      {/* @ts-ignore – iframe is a valid HTML element on web */}
      <iframe
        src={EMBED_SRC}
        style={{
          flex: 1,
          border: "none",
          width: "100%",
          height: "100%",
        }}
        title="Nearby Merchants Map"
        allowFullScreen
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CW.bg },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 10,
    backgroundColor: CW.bg,
    borderBottomWidth: 1,
    borderBottomColor: CW.border,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: CW.bgAlt,
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
});
