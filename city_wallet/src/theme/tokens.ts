import { Platform } from "react-native";

/** ── City Wallet HTML design tokens ── */
export const CW = {
  bg: "#fcfcfc",
  bgAlt: "#f7f7f5",
  text: "#1a1a1c",
  mid: "#373a46",
  soft: "rgba(55,58,70,0.5)",
  border: "rgba(0,0,0,0.08)",
  r: 20,
  pill: 40,
  /** success green used in transactions */
  green: "#2d6a4f",
  shadowCard: {
    shadowColor: "#c2c2c2",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 8,
  },
  shadowSm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

/** ── DESIGN.md Luminous Minimalist tokens (kept for backward compat) ── */
export const color = {
  surface: "#F9F9FF",
  surfaceContainer: "#FFFFFF",
  primary: "#0066CC",
  secondary: "#5C5E70",
  onSurface: "#1D1B20",
  onSurfaceVariant: "#938F99",
  error: "#BA1A1A",
  success: "#2D6A4F",
  iconActive: "#1D1B20",
  iconInactive: "#938F99",
} as const;

export const glass = {
  background: "rgba(255, 255, 255, 0.7)",
  blurRadius: 20,
} as const;

export const radii = {
  card: 24,
  button: 12,
  sm: 8,
} as const;

export const space = {
  screenGutter: 20,
  cardPadding: 18,
} as const;

export const shadow = {
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  deep: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 8,
  },
} as const;

export const fontFamily = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extrabold: "Manrope_800ExtraBold",
} as const;

export function webGlassStyle(): Record<string, string | number> {
  if (Platform.OS !== "web") {
    return { backgroundColor: glass.background };
  }
  return {
    backgroundColor: glass.background,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  } as Record<string, string | number>;
}
