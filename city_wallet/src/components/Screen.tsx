import type { PropsWithChildren } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";

import { LuminousHeader } from "@/src/components/LuminousHeader";
import { color, space } from "@/src/theme/tokens";

type ScreenProps = PropsWithChildren<{
  compact?: boolean;
  /** When set, shows the frosted top app bar (DESIGN.md) */
  appBarTitle?: string;
}>;

export function Screen({ children, compact = false, appBarTitle }: ScreenProps) {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, compact && styles.compactContent]}
    >
      {appBarTitle ? <LuminousHeader title={appBarTitle} /> : null}
      <View style={[styles.container, compact && styles.compact]}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: color.surface,
    flex: 1,
  },
  content: {
    ...Platform.select({
      web: {
        alignSelf: "center",
        maxWidth: 580,
        paddingBottom: 48,
        paddingHorizontal: space.screenGutter,
        width: "100%",
      },
      default: {
        paddingBottom: 40,
        paddingHorizontal: space.screenGutter,
      },
    }),
  },
  compactContent: {
    paddingBottom: 32,
  },
  container: {
    gap: 20,
    width: "100%",
  },
  compact: {
    gap: 12,
  },
});
