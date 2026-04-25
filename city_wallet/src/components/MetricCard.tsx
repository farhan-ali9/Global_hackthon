import { StyleSheet, Text, View } from "react-native";

import { color, fontFamily, radii, shadow } from "@/src/theme/tokens";

type MetricCardProps = {
  label: string;
  value: string;
};

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surfaceContainer,
    borderRadius: radii.card,
    flex: 1,
    minWidth: 130,
    paddingHorizontal: 18,
    paddingVertical: 16,
    ...shadow.soft,
  },
  label: {
    color: color.onSurfaceVariant,
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    marginTop: 4,
    textTransform: "uppercase",
  },
  value: {
    color: color.onSurface,
    fontFamily: fontFamily.extrabold,
    fontSize: 24,
    fontWeight: "800",
  },
});
