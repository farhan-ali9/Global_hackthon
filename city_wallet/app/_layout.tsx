import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: "#F7F5EF" },
        headerShadowVisible: false,
      }}
    />
  );
}
