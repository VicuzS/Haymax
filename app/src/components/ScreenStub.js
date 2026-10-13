import { ScrollView, View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { colors, radius, spacing, typography } from "../tokens";
import { SHOW_DEV_TAGS } from "../config";
import AppBar from "./AppBar";
import Items from "./Items";
import { WIRE } from "../data/wireframe";

function canGoBack() {
  return typeof router.canGoBack === "function" ? router.canGoBack() : false;
}

// Base mínima para pantallas aún no implementadas (hoy: ninguna — las 31 están
// hechas). Conserva el render del wireframe por si se agrega una pantalla nueva.
export default function ScreenStub({ id, name, items = 0, links = {} }) {
  const wire = WIRE[id] || [];

  return (
    <View style={styles.root}>
      <AppBar
        title={name}
        crumb={id}
        onBack={canGoBack() ? () => router.back() : undefined}
      />
      <ScrollView contentContainerStyle={styles.body}>
        {SHOW_DEV_TAGS ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{id}</Text>
          </View>
        ) : null}

        <Items items={wire} links={links} />

        {SHOW_DEV_TAGS ? (
          <Text style={styles.meta}>
            Wireframe navegable · {items} elementos
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  body: { padding: spacing.md, paddingBottom: 96 },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  chipText: { color: colors.primary, fontSize: typography.sizes.caption, fontWeight: typography.weights.bold, letterSpacing: 1 },
  meta: { fontSize: typography.sizes.small, color: colors.sub, marginTop: spacing.md },
});
