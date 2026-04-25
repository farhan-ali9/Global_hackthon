import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { color, fontFamily, webGlassStyle } from "@/src/theme/tokens";

type LuminousHeaderProps = {
  title: string;
  onPressRight?: () => void;
};

export function LuminousHeader({ title, onPressRight }: LuminousHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        Platform.OS === "web" ? webGlassStyle() : styles.barNative,
        { paddingTop: Math.max(insets.top, 12) },
      ]}
    >
      <View style={styles.avatar} accessibilityLabel="Profile">
        <Ionicons name="person-outline" size={22} color={color.iconActive} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Pressable
        accessibilityLabel="Notifications"
        hitSlop={8}
        onPress={onPressRight}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
      >
        <Ionicons name="notifications-outline" size={22} color={color.iconActive} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -20,
    marginBottom: 8,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  barNative: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
  },
  title: {
    color: color.onSurface,
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  avatar: {
    alignItems: "center",
    backgroundColor: color.surfaceContainer,
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    width: 44,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  iconBtn: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  pressed: {
    opacity: 0.6,
  },
});
