import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors, typography } from "../../tokens";

function tabIcon(icon) {
  return function TabIcon({ color, size }) {
    return <Text style={{ fontSize: size - 6, color }}>{icon}</Text>;
  };
}

// Barra inferior: Inicio · Despensa · Planificar · Ajustes (4 pestañas del prototipo).
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: typography.sizes.caption },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Inicio", tabBarIcon: tabIcon("🏠") }}
      />
      <Tabs.Screen
        name="despensa"
        options={{ title: "Despensa", tabBarIcon: tabIcon("🧺") }}
      />
      <Tabs.Screen
        name="planificar"
        options={{ title: "Planificar", tabBarIcon: tabIcon("📅") }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{ title: "Ajustes", tabBarIcon: tabIcon("⚙️") }}
      />
    </Tabs>
  );
}
