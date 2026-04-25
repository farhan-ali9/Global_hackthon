import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CW, fontFamily } from "@/src/theme/tokens";

const TABS = ["Transit", "Services", "Merchant"];

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {/* Dark scanner area */}
      <View style={styles.scanArea}>
        {/* Dot grid */}
        <View style={styles.dotGrid}>
          {Array.from({ length: 35 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  left: `${(i % 7) * 14 + 3}%`,
                  top: `${Math.floor(i / 7) * 20 + 5}%`,
                },
              ]}
            />
          ))}
        </View>

        <Text style={styles.scanHint}>Scan to Pay</Text>

        {/* QR frame */}
        <View style={styles.qrFrame}>
          {/* Corner pieces */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* QR grid mockup */}
          <View style={styles.qrGrid}>
            {Array.from({ length: 64 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.qrCell,
                  [1, 4, 7, 10, 15, 18, 23, 27, 30, 33, 38, 40, 44, 48, 52, 55, 59, 62].includes(i)
                    ? styles.qrCellOn
                    : styles.qrCellOff,
                ]}
              />
            ))}
          </View>

          {/* Center logo */}
          <View style={styles.qrCenter}>
            <Text style={styles.qrCenterIcon}>✦</Text>
          </View>
        </View>

        <Text style={styles.scanSub}>Point camera at QR code</Text>
      </View>

      {/* Bottom sheet */}
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Pay with Wallet</Text>
          <Text style={styles.sheetBalance}>€ 284.50 available</Text>
        </View>

        <View style={styles.tabRow}>
          {TABS.map((tab, i) => (
            <Pressable
              key={i}
              style={[styles.tabChip, i === 0 && styles.tabChipActive]}
            >
              <Text style={[styles.tabChipText, i === 0 && styles.tabChipTextActive]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.openCameraBtn, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.openCameraText}>Open Camera Scanner</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1a1a1c" },

  /* scanner */
  scanArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  dotGrid: { position: "absolute", inset: 0 } as never,
  dot: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  scanHint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: fontFamily.semibold,
    position: "absolute",
    top: 20,
  },

  qrFrame: {
    width: 200,
    height: 200,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "rgba(255,255,255,0.8)",
    borderStyle: "solid",
    borderRadius: 4,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderLeftWidth: 0, borderTopWidth: 0 },

  qrGrid: {
    margin: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    opacity: 0.25,
    width: 164,
    height: 164,
  },
  qrCell: { width: 17, height: 17, borderRadius: 1 },
  qrCellOn: { backgroundColor: "#fff" },
  qrCellOff: { backgroundColor: "transparent" },

  qrCenter: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  qrCenterIcon: { fontSize: 16, color: "#1a1a1c" },

  scanSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    marginTop: 16,
    fontFamily: fontFamily.regular,
    position: "absolute",
    bottom: 24,
  },

  /* sheet */
  sheet: {
    backgroundColor: CW.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 22,
    paddingTop: 22,
    gap: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitle: { fontSize: 16, fontWeight: "500", letterSpacing: -0.3, color: CW.text, fontFamily: fontFamily.medium },
  sheetBalance: { fontSize: 12, color: CW.soft, fontFamily: fontFamily.regular },

  tabRow: { flexDirection: "row", gap: 8 },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: CW.pill,
    borderWidth: 1,
    borderColor: CW.border,
    backgroundColor: CW.bg,
  },
  tabChipActive: { backgroundColor: CW.text, borderColor: CW.text },
  tabChipText: { fontSize: 12, fontWeight: "500", color: CW.mid, fontFamily: fontFamily.medium },
  tabChipTextActive: { color: "#fff" },

  openCameraBtn: {
    paddingVertical: 15,
    borderRadius: CW.pill,
    backgroundColor: "#1a1a1c",
    alignItems: "center",
  },
  openCameraText: { color: "#fff", fontSize: 15, fontWeight: "500", fontFamily: fontFamily.medium },

  pressed: { opacity: 0.8 },
});
