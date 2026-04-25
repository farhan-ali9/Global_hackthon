import { Link, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/Screen";
import { demoRule } from "@/src/data/mockData";

export default function MerchantRulesScreen() {
  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>Merchant rules</Text>
        <Text style={styles.title}>Campaign guardrails</Text>
        <Text style={styles.subtitle}>Mock rule interface for the generative engine</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.label}>Goal</Text>
        <Text style={styles.value}>{demoRule.goal}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.label}>Maximum discount</Text>
        <Text style={styles.value}>{demoRule.maxDiscountPercent}%</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.label}>Quiet hours</Text>
        <Text style={styles.value}>{demoRule.quietHours}</Text>
      </View>

      <Text style={styles.note}>
        Backend and merchant teams can replace these static values with editable
        Firestore-backed forms.
      </Text>

      <Link href={"/merchant/dashboard" as Href} style={styles.primaryLink}>
        Back to dashboard
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: "#7C3F1D",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: "#1F1A16",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 6,
  },
  subtitle: {
    color: "#75695D",
    fontSize: 16,
    marginTop: 4,
  },
  panel: {
    gap: 6,
    padding: 18,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E1D4",
    borderWidth: 1,
  },
  label: {
    color: "#75695D",
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    color: "#1F1A16",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 25,
  },
  note: {
    color: "#4F463E",
    fontSize: 15,
    lineHeight: 22,
  },
  primaryLink: {
    backgroundColor: "#1F1A16",
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    overflow: "hidden",
    padding: 16,
    textAlign: "center",
  },
});
