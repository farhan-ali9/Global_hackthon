import { useRouter, type Href } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CW, fontFamily } from "@/src/theme/tokens";

const AVATAR_COLORS = ["#c5a880", "#a8c5da", "#b5c5a8", "#d4a8c5"];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero area */}
        <View style={styles.hero}>
          <View style={styles.heroBg}>
            <View style={styles.heroBgCircle1} />
            <View style={styles.heroBgCircle2} />
            <View style={styles.heroBgGrid}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} style={styles.heroDot} />
              ))}
            </View>
          </View>

          {/* Brand chip */}
          <View style={styles.brandChip}>
            <Text style={styles.brandChipText}>City Wallet</Text>
          </View>

          {/* Hero illustration */}
          <View style={styles.heroCard}>
            <View style={styles.heroCardInner}>
              <Text style={styles.heroCardLabel}>CITY BALANCE</Text>
              <Text style={styles.heroCardAmount}>€ 284.50</Text>
              <View style={styles.heroCardRow}>
                <View style={styles.heroSubCard}>
                  <Text style={styles.heroSubLabel}>Transit</Text>
                  <Text style={styles.heroSubValue}>€ 40 left</Text>
                </View>
                <View style={styles.heroSubCard}>
                  <Text style={styles.heroSubLabel}>City Tax</Text>
                  <Text style={styles.heroSubValue}>Paid ✓</Text>
                </View>
              </View>
            </View>
          </View>

          {/* gradient fade */}
          <View style={styles.heroFade} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.headline}>
            <Text style={styles.titleMain}>Smart </Text>
            <Text style={[styles.titleMain, styles.titleItalic]}>city</Text>
            <Text style={styles.titleMain}>{"\n"}in your pocket</Text>
          </View>
          <Text style={styles.subtitle}>
            Manage transit, pay city services, and access your civic ID — all
            from one wallet.
          </Text>

          {/* Email input row */}
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor={CW.soft}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Pressable
              style={({ pressed }) => [styles.getStartedBtn, pressed && styles.pressed]}
              onPress={() => router.push("/onboarding" as Href)}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </Pressable>
          </View>

          {/* Social proof */}
          <View style={styles.social}>
            <View style={styles.avatarStack}>
              {AVATAR_COLORS.map((c, i) => (
                <View
                  key={i}
                  style={[styles.avatar, { backgroundColor: c, marginLeft: i > 0 ? -8 : 0 }]}
                />
              ))}
            </View>
            <View>
              <View style={styles.stars}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Text key={i} style={styles.star}>★</Text>
                ))}
              </View>
              <Text style={styles.reviews}>1,020+ Reviews</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
            onPress={() => router.replace("/(tabs)" as Href)}
          >
            <Text style={styles.ghostBtnText}>Already have an account? Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CW.bg },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  /* hero */
  hero: {
    height: 300,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f0f0f8",
  },
  heroBg: { position: "absolute", inset: 0 } as never,
  heroBgCircle1: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(100,130,200,0.12)",
    top: -60,
    right: -40,
  },
  heroBgCircle2: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(197,168,128,0.15)",
    bottom: -30,
    left: 20,
  },
  heroBgGrid: {
    position: "absolute",
    inset: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    gap: 30,
    opacity: 0.4,
  } as never,
  heroDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(55,58,70,0.2)" },
  heroFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "transparent",
  },

  brandChip: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 40,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: CW.border,
    zIndex: 2,
  },
  brandChipText: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: CW.mid,
    fontFamily: fontFamily.semibold,
  },

  heroCard: {
    position: "absolute",
    bottom: 24,
    left: 22,
    right: 22,
    zIndex: 2,
  },
  heroCardInner: {
    backgroundColor: "#1a1a1c",
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
  },
  heroCardLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    fontFamily: fontFamily.semibold,
  },
  heroCardAmount: {
    fontSize: 32,
    fontWeight: "300",
    color: "#fff",
    letterSpacing: -1,
    marginTop: 4,
    fontFamily: fontFamily.regular,
  },
  heroCardRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  heroSubCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 10,
  },
  heroSubLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: fontFamily.semibold,
  },
  heroSubValue: { fontSize: 13, fontWeight: "500", color: "#fff", marginTop: 2, fontFamily: fontFamily.medium },

  /* content */
  content: { flex: 1, padding: 26, paddingTop: 20, gap: 16 },

  headline: { flexDirection: "row", flexWrap: "wrap" },
  titleMain: {
    fontFamily: fontFamily.medium,
    fontWeight: "500",
    fontSize: 34,
    letterSpacing: -1.4,
    color: CW.text,
    lineHeight: 40,
  },
  titleItalic: { fontStyle: "italic", fontSize: 40 },

  subtitle: {
    fontSize: 14,
    color: CW.mid,
    lineHeight: 22,
    opacity: 0.82,
    fontFamily: fontFamily.regular,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CW.bg,
    borderRadius: CW.pill,
    borderWidth: 1,
    borderColor: CW.border,
    paddingLeft: 18,
    paddingRight: 5,
    paddingVertical: 5,
    gap: 8,
    ...({
      shadowColor: "#c2c2c2",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 40,
      elevation: 8,
    } as object),
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: CW.text,
    fontFamily: fontFamily.regular,
    height: 40,
  },
  getStartedBtn: {
    backgroundColor: "#1a1a1c",
    borderRadius: CW.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  getStartedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    fontFamily: fontFamily.medium,
    whiteSpace: "nowrap",
  } as never,

  social: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarStack: { flexDirection: "row" },
  avatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#fff" },
  stars: { flexDirection: "row", gap: 1 },
  star: { fontSize: 10, color: "#f59e0b" },
  reviews: { fontSize: 11, color: CW.soft, fontFamily: fontFamily.regular },

  ghostBtn: {
    borderRadius: CW.pill,
    borderWidth: 1.5,
    borderColor: CW.border,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: CW.bg,
  },
  ghostBtnText: {
    fontSize: 15,
    fontWeight: "500",
    color: CW.text,
    fontFamily: fontFamily.medium,
  },

  pressed: { opacity: 0.7 },
});
