import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { CW, fontFamily } from "@/src/theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ITEMS: { name: string; label: string; icon: IoniconsName; iconActive: IoniconsName }[] = [
  { name: "index",    label: "Home",     icon: "home-outline",    iconActive: "home"    },
  { name: "coupons",  label: "Coupons",  icon: "ticket-outline",  iconActive: "ticket"  },
  { name: "activity", label: "Activity", icon: "time-outline",    iconActive: "time"    },
  { name: "profile",  label: "Profile",  icon: "person-outline",  iconActive: "person"  },
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
      {/* Hide legacy tabs from bar – routes kept for backward nav */}
      <Tabs.Screen name="cards"    options={{ href: null }} />
      <Tabs.Screen name="services" options={{ href: null }} />
    </Tabs>
  );
}
