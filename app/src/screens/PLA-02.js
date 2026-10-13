import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import useApi from "../hooks/useApi";
import { getReceta } from "../lib/api";

const NOMBRE = "Confirmación: plato agregado al plan";

export default function PLA_02({ receta, porciones, dia }) {
  const { data, loading, error, recargar } = useApi(() => getReceta(receta));

  if (loading) {
    return (
      <Screen id="PLA-02" name={NOMBRE}>
        <K.Loading text="Guardando en tu plan…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="PLA-02" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const r = data.receta;

  return (
    <Screen id="PLA-02" name={NOMBRE}>
      <K.CheckCircle title="Plato agregado a tu plan" />
      <K.SectionTitle title={`Se usarán (${dia || "Hoy"} · ${porciones || r.porciones} porciones)`} />
      <View style={styles.rows}>
        {r.ingredientes.slice(0, 4).map((ing) => (
          <K.Row key={ing} label={ing} value="✓" />
        ))}
      </View>
      <K.Note text="Actualizaremos tu plan cada noche mientras duermes." />
      <Button label="Entendido" full onPress={() => go("PLA-05")} />
      <Button label="Ver mi plan de hoy" variant="outline" full onPress={() => go("INI-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 0 } });
