import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

type ScreenProps = PropsWithChildren<{
  compact?: boolean;
}>;

export function Screen({ children, compact = false }: ScreenProps) {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={[styles.container, compact && styles.compact]}>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  container: {
    gap: 16,
    width: "100%",
  },
  compact: {
    gap: 12,
  },
});
