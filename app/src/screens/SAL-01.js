import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, spacing } from "../tokens";
import useApi from "../hooks/useApi";
import { getBalance } from "../lib/api";

const NOMBRE = "Balance y ahorro de la semana";
const TONO = { amber: colors.amber };

export default function SAL_01() {
  const { data, loading, error, recargar } = useApi(getBalance);

  if (loading) {
    return (
      <Screen id="SAL-01" name={NOMBRE}>
        <K.Loading text="Calculando tu balance…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="SAL-01" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  return (
    <Screen id="SAL-01" name={NOMBRE}>
      <K.Stat value={`${data.pct}%`} label="Balance de tu semana" delta={data.delta} />

      <K.SectionTitle title="Esta semana cocinaste" />
      <View style={styles.rows}>
        {data.cocinadas.map((c) => (
          <K.Row
            key={c.label}
            label={c.label}
            value={c.value}
            icon={c.icon}
            valueColor={c.color ? TONO[c.color] : undefined}
          />
        ))}
      </View>

      <K.SectionTitle title="Sugerencias simples" />
      {data.sugerencias.map((s) => (
        <K.Card key={s.id} title={s.title} sub={s.sub} />
      ))}

      <Button label="Cocinar algo más balanceado" full onPress={() => go("REC-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 0, marginBottom: spacing.xs } });
