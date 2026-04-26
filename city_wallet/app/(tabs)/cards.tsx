import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CW, fontFamily } from "@/src/theme/tokens";

const CARDS = [
  {
    label: "City Transit Pass",
    num: "•••• •••• •••• 8821",
    sub: "Valid until Dec 2026",
    bg: "#1a1a1c",
    tag: "TRANSIT",
  },
  {
    label: "Civic Identity Card",
    num: "ID: AT-LNZ-2041-9923",
    sub: "Linz · Born 1990",
    bg: "#2d4a3e",
    tag: "CIVIC ID",
  },
  {
    label: "City Pay Card",
    num: "•••• •••• •••• 3374",
    sub: "Contactless NFC",
    bg: "#c5a880",
    tag: "PAYMENT",
  },
];

const CARD_DETAILS = [
  { l: "Balance", v: "€ 40.00" },
  { l: "Monthly limit", v: "€ 200.00" },
  { l: "Status", v: "Active ✓" },
];

export default function CardsScreen() {
  const [active, setActive] = useState(0);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Cards</Text>
        <Pressable style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>

      {/* Card stack */}
      <View style={styles.stackWrap}>
        {CARDS.map((card, i) => {
          const diff = i - active;
          const absDiff = Math.abs(diff);
          return (
            <Pressable
              key={i}
              onPress={() => setActive(i)}
              style={[
                styles.stackCard,
                {
                  top: diff * 14,
                  zIndex: CARDS.length - absDiff,
                  transform: [{ scale: 1 - absDiff * 0.04 }],
                  opacity: absDiff > 1 ? 0.45 : 1,
                },
              ]}
            >
              <View style={[styles.cardFace, { backgroundColor: card.bg }]}>
                <View style={styles.cardCircle} />
                <View style={styles.cardTop}>
                  <Text style={styles.cardTag}>{card.tag}</Text>
                  <Text style={styles.cardStar}>✦</Text>
                </View>
                <Text style={styles.cardNum}>{card.num}</Text>
                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.cardMetaLabel}>Card Name</Text>
                    <Text style={styles.cardMetaValue}>{card.label}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.cardMetaLabel}>Info</Text>
                    <Text style={styles.cardMetaSub}>{card.sub}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {CARDS.map((_, i) => (
          <Pressable key={i} onPress={() => setActive(i)}>
            <View
              style={[
                styles.dot,
                { width: i === active ? 18 : 6, backgroundColor: i === active ? CW.text : CW.border },
              ]}
            />
          </Pressable>
        ))}
      </View>

      {/* Details */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.detailList}>
          {CARD_DETAILS.map((row, i, arr) => (
            <View
              key={i}
              style={[styles.detailRow, i < arr.length - 1 && styles.detailBorder]}
            >
              <Text style={styles.detailLabel}>{row.l}</Text>
              <Text style={styles.detailValue}>{row.v}</Text>
            </View>
          ))}
        </View>

        <View style={styles.btnRow}>
          <Pressable style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}>
            <Text style={styles.ghostBtnText}>View Details</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.darkBtn, pressed && styles.pressed]}>
            <Text style={styles.darkBtnText}>Use Card</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CW.bgAlt },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 0,
  },
  title: { fontSize: 21, fontWeight: "500", letterSpacing: -0.7, color: CW.text, fontFamily: fontFamily.medium },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: CW.bg,
    borderWidth: 1,
    borderColor: CW.border,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { fontSize: 18, color: CW.text, lineHeight: 26 },

  /* card stack */
  stackWrap: { height: 230, marginHorizontal: 22, marginTop: 18, position: "relative" },
  stackCard: {
    position: "absolute",
    left: 0,
    right: 0,
    transformOrigin: "top center",
  } as never,
  cardFace: {
    borderRadius: 20,
    padding: 22,
    minHeight: 155,
    overflow: "hidden",
    position: "relative",
  },
  cardCircle: {
    position: "absolute",
    top: -16,
    right: -16,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTag: { fontSize: 9, letterSpacing: 1.4, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", fontFamily: fontFamily.semibold },
  cardStar: { fontSize: 14, color: "rgba(255,255,255,0.6)" },
  cardNum: { marginTop: 22, fontSize: 15, letterSpacing: 1, color: "#fff", fontWeight: "400", fontFamily: fontFamily.regular },
  cardBottom: { marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cardMetaLabel: { fontSize: 9, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 0.8, fontFamily: fontFamily.semibold },
  cardMetaValue: { fontSize: 13, color: "#fff", fontWeight: "500", fontFamily: fontFamily.medium },
  cardMetaSub: { fontSize: 11, color: "rgba(255,255,255,0.75)", fontFamily: fontFamily.regular },

  /* dots */
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 10 },
  dot: { height: 6, borderRadius: 3 },

  /* details */
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 2 },
  detailList: {
    backgroundColor: CW.bg,
    borderRadius: CW.r,
    borderWidth: 1,
    borderColor: CW.border,
    overflow: "hidden",
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: CW.border },
  detailLabel: { fontSize: 13, color: CW.soft, fontFamily: fontFamily.regular },
  detailValue: { fontSize: 13, fontWeight: "500", color: CW.text, fontFamily: fontFamily.medium },

  btnRow: { flexDirection: "row", gap: 10 },
  ghostBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: CW.pill,
    borderWidth: 1.5,
    borderColor: CW.border,
    alignItems: "center",
    backgroundColor: CW.bg,
  },
  ghostBtnText: { fontSize: 13, fontWeight: "500", color: CW.text, fontFamily: fontFamily.medium },
  darkBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: CW.pill,
    backgroundColor: "#1a1a1c",
    alignItems: "center",
  },
  darkBtnText: { fontSize: 13, fontWeight: "500", color: "#fff", fontFamily: fontFamily.medium },

  pressed: { opacity: 0.75 },
});
