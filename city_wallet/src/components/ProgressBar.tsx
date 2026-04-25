import { StyleSheet, View } from "react-native";

import { color, radii } from "@/src/theme/tokens";

type ProgressBarProps = {
  /** 0–1 */
  value: number;
};

const trackGrey = "rgba(93, 94, 112, 0.22)";

export function ProgressBar({ value }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <View style={styles.row} accessibilityRole="progressbar">
      <View style={[styles.fill, { flex: clamped }]} />
      <View style={[styles.rest, { flex: Math.max(0, 1 - clamped) }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: radii.button,
    flexDirection: "row",
    height: 8,
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    backgroundColor: color.primary,
    height: 8,
  },
  rest: {
    backgroundColor: trackGrey,
    height: 8,
  },
});
