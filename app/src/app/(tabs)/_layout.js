import { Tabs } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, shadows } from "../../tokens";
import { go } from "../../lib/nav";

const ICONS = {
  index: ["home", "home-outline"],
  despensa: ["basket", "basket-outline"],
  planificar: ["calendar", "calendar-outline"],
  ajustes: ["settings", "settings-outline"],
};

// Barra inferior: 4 pestañas del prototipo + botón central de cámara
// (reemplaza al FAB por pantalla; misma acción → DES-03).
function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const nodes = [];

  state.routes.forEach((route, i) => {
    const focused = state.index === i;
    const title = descriptors[route.key].options.title || route.name;
    const [onIcon, offIcon] = ICONS[route.name] || ["ellipse", "ellipse-outline"];
    nodes.push(
      <Pressable
        key={route.key}
        style={styles.tab}
        onPress={() => {
          const ev = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !ev.defaultPrevented) navigation.navigate(route.name);
        }}
      >
        <Ionicons name={focused ? onIcon : offIcon} size={20} color={focused ? colors.primary : colors.muted} />
        <Text style={[styles.tabLabel, focused && styles.tabLabelOn]} numberOfLines={1}>
          {title}
        </Text>
      </Pressable>
    );
    if (i === 1) {
      nodes.push(
        <Pressable key="cam" style={styles.camWrap} onPress={() => go("DES-03")} accessibilityLabel="Escanear insumos">
          <View style={styles.cam}>
            <Ionicons name="camera" size={22} color={colors.white} />
          </View>
        </Pressable>
      );
    }
  });

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>{nodes}</View>
  );
}

// Barra inferior: Inicio · Despensa · [cámara] · Planificar · Ajustes.
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="despensa" options={{ title: "Despensa" }} />
      <Tabs.Screen name="planificar" options={{ title: "Planificar" }} />
      <Tabs.Screen name="ajustes" options={{ title: "Ajustes" }} />
      {/* Pantallas apiladas (/screen/DES-03...): se renderizan dentro de la
          barra inferior, pero sin pestaña propia. */}
      <Tabs.Screen name="screen/[id]" options={{ href: null, title: "" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 2 },
  tabLabel: { fontSize: typography.sizes.caption, color: colors.muted },
  tabLabelOn: { color: colors.primary, fontWeight: typography.weights.semibold },
  camWrap: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  cam: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
    marginTop: -26,
    ...shadows.fab,
  },
});
