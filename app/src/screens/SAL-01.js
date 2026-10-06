import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, spacing } from "../tokens";
import { balanceSemanal } from "../lib/domain";

const COCINADAS = [
  { label: "Proteínas", value: "3 platos", icon: "🥩", color: undefined },
  { label: "Verduras", value: "5 platos", icon: "🥦", color: undefined },
  { label: "Frituras", value: "2 platos", icon: "🍟", color: colors.amber },
];

const SUGERENCIAS = [
  { id: "S1", title: "Suma 1 ensalada en 2 días", sub: "más fibra" },
  { id: "S2", title: "Cambia 1 fritura por caldo", sub: "menos aceite" },
];

export default function SAL_01() {
  const b = balanceSemanal();

  return (
    <Screen id="SAL-01" name="Balance y ahorro de la semana">
      <K.Stat value={`${b.pct}%`} label="Balance de tu semana" delta={b.delta} />

      <K.SectionTitle title="Esta semana cocinaste" />
      <View style={styles.rows}>
        {COCINADAS.map((c) => (
          <K.Row key={c.label} label={c.label} value={c.value} icon={c.icon} valueColor={c.color} />
        ))}
      </View>

      <K.SectionTitle title="Sugerencias simples" />
      {SUGERENCIAS.map((s) => (
        <K.Card key={s.id} title={s.title} sub={s.sub} />
      ))}

      <Button label="Cocinar algo más balanceado" full onPress={() => go("REC-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 0, marginBottom: spacing.xs } });
