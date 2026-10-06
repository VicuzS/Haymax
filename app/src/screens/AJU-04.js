import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, spacing } from "../tokens";

const PREMIUM = [
  "Escaneo ilimitado",
  "Recomendaciones por distrito",
  "Resumen de salud completo",
];

export default function AJU_04() {
  return (
    <Screen id="AJU-04" name="Plan de suscripción">
      <K.SectionTitle title="Haymax Gratis" />
      <K.Card title="Escaneo limitado" sub="Hasta 10 escaneos al mes" />
      <K.Card title="Salud resumida" sub="Balance semanal básico" />

      <K.SectionTitle title="Haymax Premium" />
      <K.Banner title="S/ 12.90 al mes" sub="Cancela cuando quieras" tone="PRIMARY" />
      <View style={styles.rows}>
        {PREMIUM.map((p) => (
          <K.Row key={p} label={p} value="✓" />
        ))}
      </View>

      <Button label="Suscribirme" full onPress={() => go("AJU-01")} />
      <K.LinkText label="Probar el escaneo ilimitado (Premium)" onPress={() => go("DES-05")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 0, marginBottom: spacing.xs, marginTop: spacing.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.xs } });
