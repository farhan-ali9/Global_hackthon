import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUserContextLoop } from "@/src/context-engine/UserContextLoopProvider";
import { fontFamily } from "@/src/theme/tokens";
export default function CouponDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recommendation } = useUserContextLoop();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.9)" />
        </Pressable>
      </View>
      <View style={styles.messageCard}>
        <Text style={styles.offerTitle}>Offer screen is paused</Text>
        <Text style={styles.fieldValue}>
          The flow currently stops after merchant recommendation. Coupon generation and redemption are intentionally disabled.
        </Text>
        <Text style={styles.fieldValue}>Current recommendation: {recommendation?.merchantId ?? "none yet"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24 },

  /* top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    gap: 0,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  fieldValue: { fontSize: 14, color: "#fff", fontWeight: "600", fontFamily: fontFamily.semibold, lineHeight: 22 },
  offerTitle: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 32,
    fontFamily: fontFamily.extrabold,
  },
  messageCard: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    gap: 12,
  },
});
