import { useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { colors, radius, spacing, typography } from "../tokens";
import AppBar from "./AppBar";
import Button from "./Button";
import Items from "./Items";
import { go } from "../lib/nav";
import { WIRE } from "../data/wireframe";

function canGoBack() {
  return typeof router.canGoBack === "function" ? router.canGoBack() : false;
}

// Base de las 31 pantallas: pinta el wireframe con el kit de UI (Fase 0) y
// mantiene el ID, el nombre y las conexiones mientras cada pantalla se
// implementa de verdad (Fases 1-4).
export default function ScreenStub({ id, name, items = 0, links = {} }) {
  const [showNav, setShowNav] = useState(false);
  const wire = WIRE[id] || [];
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

        <Items items={wire} links={links} />

        <View style={styles.footer}>
          <Text style={styles.meta}>
            Wireframe navegable · {items} elementos · {targets.length} destinos
          </Text>
          <Button
            label={showNav ? "Ocultar enlaces" : "Ver enlaces de esta pantalla"}
            variant="ghost"
            full
            onPress={() => setShowNav((v) => !v)}
          />
          {showNav
            ? targets.map((t) => (
                <Button
                  key={t}
                  label={`Ir a ${t}`}
                  variant="outline"
                  full
                  onPress={() => go(t)}
                />
              ))
            : null}
        </View>
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
  footer: { gap: spacing.sm, marginTop: spacing.sm, padding: spacing.md, backgroundColor: colors.greyBg, borderRadius: radius.lg },
  meta: { fontSize: typography.sizes.small, color: colors.sub },
});
