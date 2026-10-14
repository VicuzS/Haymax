import { useEffect, useState } from "react";
import { Tabs, router, usePathname } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, shadows } from "../../tokens";
import { go, isAuthScreenPath } from "../../lib/nav";
import { leerSesion } from "../../lib/sesion";

const ICONS = {
  index: ["home", "home-outline"],
  despensa: ["basket", "basket-outline"],
  planificar: ["calendar", "calendar-outline"],
  ajustes: ["settings", "settings-outline"],
};

function tabForScreen(id) {
  if (String(id || "").startsWith("DES-")) return "despensa";
  if (String(id || "").startsWith("PLA-")) return "planificar";
  if (String(id || "").startsWith("AJU-")) return "ajustes";
  return "index";
}

// La ruta dinámica [id] es una pantalla apilada, nunca una pestaña.
function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const nodes = [];
  const activeRoute = state.routes[state.index];
  const dynamicId = activeRoute && activeRoute.name === "screen/[id]" ? activeRoute.params?.id : null;
  const selectedTab = dynamicId ? tabForScreen(Array.isArray(dynamicId) ? dynamicId[0] : dynamicId) : activeRoute?.name;

  state.routes.forEach((route) => {
    if (route.name === "screen/[id]") return;
    const focused = selectedTab === route.name;
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
    // La cámara ocupa el espacio central entre Despensa y Planificar.
    if (route.name === "despensa") {
      nodes.push(
        <Pressable key="cam" style={styles.camWrap} onPress={() => go("DES-03")} accessibilityLabel="Escanear insumos">
          <View style={styles.cam}>
            <Ionicons name="camera" size={22} color={colors.white} />
          </View>
        </Pressable>
      );
    }
  });

  return <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>{nodes}</View>;
}

export default function TabsLayout() {
  const pathname = usePathname();
  const rutaAutenticacion = isAuthScreenPath(pathname);
  const [sesionRevisada, setSesionRevisada] = useState(false);

  useEffect(() => {
    let activo = true;
    const protegerRuta = async () => {
      const sesion = await leerSesion();
      const conCuenta = !!(sesion && sesion.modo === "cuenta" && sesion.token);
      const esRutaPublica = isAuthScreenPath(pathname);

      if (!conCuenta && !esRutaPublica) {
        router.replace("/screen/ACC-02");
        return;
      }
      if (conCuenta && esRutaPublica) {
        router.replace("/(tabs)");
        return;
      }
      if (activo) setSesionRevisada(true);
    };
    protegerRuta().catch(() => {
      if (!isAuthScreenPath(pathname)) router.replace("/screen/ACC-02");
      else if (activo) setSesionRevisada(true);
    });
    return () => { activo = false; };
  }, [pathname]);

  const mostrarBarra = sesionRevisada && !rutaAutenticacion;
  return (
    <Tabs
      tabBar={(props) => (mostrarBarra ? <TabBar {...props} /> : null)}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="despensa" options={{ title: "Despensa" }} />
      <Tabs.Screen name="planificar" options={{ title: "Planificar" }} />
      <Tabs.Screen name="ajustes" options={{ title: "Ajustes" }} />
      {/* Pantallas apiladas: nunca se muestran como elementos del menú inferior. */}
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
