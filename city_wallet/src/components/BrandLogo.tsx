import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { fontFamily } from "@/src/theme/tokens";

type BrandLogoProps = {
  size: number;
  logoLetter: string;
  brandColor: string;
  accentColor: string;
  logoUrl?: string;
};

/**
 * Renders a circular brand logo:
 *  - If `logoUrl` is provided → white circle with the remote logo image inside.
 *  - Otherwise              → accent-color circle with the initial letter.
 */
export function BrandLogo({
  size,
  logoLetter,
  brandColor,
  accentColor,
  logoUrl,
}: BrandLogoProps) {
  const radius = size / 2;
  const imgSize = size * 0.62;

  if (logoUrl) {
    return (
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: "#fff",
            borderWidth: 1.5,
            borderColor: brandColor + "22",
          },
        ]}
      >
        <Image
          source={{ uri: logoUrl }}
          style={{ width: imgSize, height: imgSize }}
          contentFit="contain"
          transition={200}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: radius, backgroundColor: accentColor },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{logoLetter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  letter: { fontWeight: "800", color: "#fff", fontFamily: fontFamily.extrabold },
});
