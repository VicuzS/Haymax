import { View, Text, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { renderScreen } from "../../screens";
import { colors, spacing, typography } from "../../tokens";

function NotFound({ id }) {
  return (
    <View style={styles.missing}>
      <Text style={styles.code}>{id || "?"}</Text>
      <Text style={styles.title}>Pantalla no encontrada</Text>
      <Text style={styles.text}>
        El ID no existe en el registro de las 31 pantallas (src/screens/index.js).
      </Text>
    </View>
  );
}

// Ruta dinámica: /screen/ACC-03, /screen/DES-05... — mantiene el ID del inventario.
// Los params llegan como props a la pantalla (p. ej. REC-02 con { receta }).
export default function ScreenRoute() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const screen = renderScreen(id, params);

  return (
    <>
      <Stack.Screen options={{ title: id || "Haymax" }} />
      {screen || <NotFound id={id} />}
    </>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.white },
  code: { fontSize: typography.sizes.caption, letterSpacing: 2, color: colors.primary, backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999, overflow: "hidden" },
  title: { fontSize: typography.sizes.subtitle, fontWeight: typography.weights.bold, color: colors.text },
  text: { fontSize: typography.sizes.body, color: colors.sub, textAlign: "center" },
});
