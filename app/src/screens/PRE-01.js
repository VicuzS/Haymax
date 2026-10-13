import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import useApi from "../hooks/useApi";
import { getPreparar, descontarAlCocinar } from "../lib/api";

const NOMBRE = "Preparar: descontar insumos";
const HORARIO = { almuerzo: "13:00", cena: "20:00" };

const DESCUENTOS = [
  { id: "D1", label: "Lomo fino de res", qty: 500, unit: "g" },
  { id: "D2", label: "Cebolla roja", qty: 2, unit: "unid" },
  { id: "D3", label: "Tomate italiano", qty: 2, unit: "unid" },
  { id: "D4", label: "Papa amarilla", qty: 500, unit: "g" },
];

export default function PRE_01({ receta }) {
  const { data, loading, error, recargar } = useApi(() => getPreparar(receta));
  const [porciones, setPorciones] = useState(null);

  if (loading) {
    return (
      <Screen id="PRE-01" name={NOMBRE}>
        <K.Loading text="Preparando…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="PRE-01" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const r = data.receta;
  const plan = data.plan;
  const encabezado = plan
    ? `${plan.comida.toUpperCase()} · ${HORARIO[plan.comida] || "13:00"}`
    : "CENA · 20:00";
  const porc = porciones == null ? (plan ? plan.porciones : r.porciones) : porciones;

  const confirmar = async () => {
    await descontarAlCocinar(DESCUENTOS);
    go("PRE-02");
  };

  return (
    <Screen id="PRE-01" name={NOMBRE}>
      <K.SectionTitle title={encabezado} />
      <K.Card thumb={r.imagen} title={r.nombre} sub={`${porc} porciones planificadas`} />
      <View style={styles.rows}>
        <K.EditStepper
          label="Porciones preparadas"
          qty={porc}
          onChange={(d) => setPorciones(Math.max(1, Math.min(12, porc + d)))}
        />
      </View>

      <K.SectionTitle title="Insumos detectados" />
      <View style={styles.rows}>
        {r.ingredientes.slice(0, 4).map((ing) => (
          <K.Row key={ing} label={ing} value="✓" />
        ))}
      </View>
      <K.InputField placeholder="¿Usaste algún ingrediente extra?" />

      <Button label="Confirmar y descontar de despensa" full onPress={confirmar} />
      <K.LinkText label="Omitir por ahora" align="CENTER" onPress={() => go("INI-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
