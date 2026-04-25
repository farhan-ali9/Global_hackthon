import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { CW, fontFamily } from "@/src/theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ITEMS: { name: string; label: string; icon: IoniconsName; iconActive: IoniconsName }[] = [
  { name: "index",    label: "Home",     icon: "home-outline",    iconActive: "home" },
  { name: "cards",    label: "Cards",    icon: "card-outline",    iconActive: "card" },
  { name: "services", label: "Services", icon: "grid-outline",    iconActive: "grid" },
  { name: "activity", label: "Activity", icon: "pulse-outline",   iconActive: "pulse" },
  { name: "profile",  label: "Profile",  icon: "person-outline",  iconActive: "person" },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: CW.bg,
          borderTopColor: CW.border,
          borderTopWidth: 1,
          height: 70,
          paddingTop: 10,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: CW.text,
        tabBarInactiveTintColor: "rgba(55,58,70,0.35)",
        tabBarLabelStyle: {
          fontSize: 9,
          fontFamily: fontFamily.semibold,
          letterSpacing: 0.5,
        },
      }}
    >
      {TAB_ITEMS.map((item) => (
        <Tabs.Screen
          key={item.name}
          name={item.name}
          options={{
            title: item.label,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? item.iconActive : item.icon}
                size={20}
                color={color}
                style={{ opacity: focused ? 1 : 0.35 }}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
