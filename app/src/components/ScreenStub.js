import { ScrollView, View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { colors, radius, spacing, typography } from "../tokens";
import AppBar from "./AppBar";
import Button from "./Button";
import { go } from "../lib/nav";

function canGoBack() {
  return typeof router.canGoBack === "function" ? router.canGoBack() : false;
}

// Stub de las 31 pantallas del inventario: mantiene el ID, el nombre y las
// conexiones de navegación mientras se implementa el contenido real.
export default function ScreenStub({ id, name, items = 0, links = {} }) {
  const targets = Object.keys(links)
    .map((k) => links[k])
    .filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <View style={styles.root}>
      <AppBar
        title={name}
        crumb={id}
        onBack={canGoBack() ? () => router.back() : undefined}
      />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{id}</Text>
        </View>
        <Text style={styles.heading}>Pendiente de implementar</Text>
        <Text style={styles.paragraph}>
          Reemplaza el contenido de {""}
          <Text style={styles.mono}>src/screens/{id}.js</Text> por los componentes reales
          usando los tokens de <Text style={styles.mono}>src/tokens</Text>.
        </Text>
        <Text style={styles.meta}>Elementos del wireframe: {items}</Text>

        {targets.length > 0 ? (
          <View style={styles.navBox}>
            <Text style={styles.navTitle}>Navegación de esta pantalla</Text>
            {targets.map((t) => (
              <Button
                key={t}
                label={`Ir a ${t}`}
                variant="outline"
                full
                onPress={() => go(t)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  body: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: { color: colors.primary, fontSize: typography.sizes.caption, fontWeight: typography.weights.bold, letterSpacing: 1 },
  heading: { fontSize: typography.sizes.title, fontWeight: typography.weights.bold, color: colors.text },
  paragraph: { fontSize: typography.sizes.body, color: colors.sub, lineHeight: 20 },
  mono: { fontFamily: "monospace", color: colors.primary },
  meta: { fontSize: typography.sizes.small, color: colors.muted, marginBottom: spacing.sm },
  navBox: { gap: spacing.sm, marginTop: spacing.sm, padding: spacing.md, backgroundColor: colors.greyBg, borderRadius: radius.lg },
  navTitle: { fontSize: typography.sizes.small, color: colors.sub, fontWeight: typography.weights.semibold, textTransform: "uppercase", letterSpacing: 0.8 },
});
