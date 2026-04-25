import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CW, fontFamily } from "@/src/theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const SERVICES: { icon: IoniconsName; label: string; desc: string; color: string }[] = [
  { icon: "bus-outline",      label: "Public Transit", desc: "Tickets & passes",  color: "#e8f0fa" },
  { icon: "document-outline", label: "City Permits",   desc: "Apply & renew",    color: "#f0eee8" },
  { icon: "car-outline",      label: "Parking",        desc: "Pay & extend",     color: "#eaf0f8" },
  { icon: "leaf-outline",     label: "Park Access",    desc: "Reservations",     color: "#eaf0e8" },
  { icon: "bicycle-outline",  label: "Bike Share",     desc: "Unlock & ride",    color: "#f8f0ea" },
  { icon: "refresh-outline",  label: "Recycling",      desc: "Book collection",  color: "#eef8ee" },
];

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          City{" "}
          <Text style={styles.titleItalic}>Services</Text>
        </Text>
        <Text style={styles.subtitle}>Munich · Your local services</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchText}>Search services…</Text>
        </View>
      </View>

      {/* Featured */}
      <View style={styles.featuredWrap}>
        <View style={styles.featured}>
          <View style={styles.featuredLeft}>
            <Text style={styles.featuredTag}>Featured</Text>
            <Text style={styles.featuredTitle}>Annual City Pass</Text>
            <Text style={styles.featuredSub}>All transit + services for €99/yr</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.getBtn, pressed && styles.pressed]}>
            <Text style={styles.getBtnText}>Get →</Text>
          </Pressable>
        </View>
      </View>

      {/* Grid */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>All Services</Text>
        <View style={styles.grid}>
          {SERVICES.map((sv, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.serviceCard, { backgroundColor: sv.color }, pressed && styles.pressed]}
            >
              <Ionicons name={sv.icon} size={22} color={CW.text} />
              <Text style={styles.serviceLabel}>{sv.label}</Text>
              <Text style={styles.serviceDesc}>{sv.desc}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ height: 8 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CW.bgAlt },
  header: { paddingHorizontal: 22, paddingBottom: 4 },
  title: { fontSize: 21, fontWeight: "500", letterSpacing: -0.7, color: CW.text, fontFamily: fontFamily.medium },
  titleItalic: { fontStyle: "italic" },
  subtitle: { fontSize: 12, color: CW.soft, marginTop: 3, fontFamily: fontFamily.regular },

  searchWrap: { paddingHorizontal: 22, paddingTop: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: CW.bg,
    borderRadius: CW.pill,
    borderWidth: 1,
    borderColor: CW.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...({
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    } as object),
  },
  searchIcon: { fontSize: 13 },
  searchText: { fontSize: 13, color: CW.soft, fontFamily: fontFamily.regular },

  featuredWrap: { paddingHorizontal: 22, paddingTop: 12 },
  featured: {
    borderRadius: 18,
    backgroundColor: "#1a1a1c",
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  featuredLeft: { flex: 1 },
  featuredTag: {
    fontSize: 9,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontFamily: fontFamily.semibold,
  },
  featuredTitle: { fontSize: 15, fontWeight: "500", color: "#fff", marginTop: 4, letterSpacing: -0.3, fontFamily: fontFamily.medium },
  featuredSub: { fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2, fontFamily: fontFamily.regular },
  getBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: CW.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  getBtnText: { color: "#fff", fontSize: 12, fontWeight: "500", fontFamily: fontFamily.medium },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 14 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: CW.soft,
    fontFamily: fontFamily.semibold,
    marginBottom: 10,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  serviceCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    gap: 8,
  },
  serviceLabel: { fontSize: 13, fontWeight: "600", color: CW.text, fontFamily: fontFamily.bold },
  serviceDesc: { fontSize: 11, color: CW.soft, fontFamily: fontFamily.regular },

  pressed: { opacity: 0.75 },
});
