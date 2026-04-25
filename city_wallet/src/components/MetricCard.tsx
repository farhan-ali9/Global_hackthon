import { StyleSheet, Text, View } from "react-native";

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
    flex: 1,
    minWidth: 130,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E1D4",
    borderWidth: 1,
  },
  value: {
    color: "#1F1A16",
    fontSize: 24,
    fontWeight: "800",
  },
  label: {
    color: "#75695D",
    fontSize: 13,
    marginTop: 4,
  },
});
