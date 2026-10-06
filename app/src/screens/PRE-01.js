import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import { recetaById } from "../lib/domain";
import { mealPlanMock, descontarDespensa } from "../data/mock";

const HORARIO = { almuerzo: "13:00", cena: "20:00" };

const DESCUENTOS = [
  { id: "D1", label: "Lomo fino de res", qty: 500, unit: "g" },
  { id: "D2", label: "Cebolla roja", qty: 2, unit: "unid" },
  { id: "D3", label: "Tomate italiano", qty: 2, unit: "unid" },
  { id: "D4", label: "Papa amarilla", qty: 500, unit: "g" },
];

export default function PRE_01({ receta }) {
  const r = recetaById(receta);
  const plan = mealPlanMock.find((m) => m.recetaId === r.id);
  const encabezado = plan
    ? `${plan.comida.toUpperCase()} · ${HORARIO[plan.comida] || "13:00"}`
    : "CENA · 20:00";
  const [porciones, setPorciones] = useState(plan ? plan.porciones : r.porciones);

  const confirmar = () => {
    descontarDespensa(DESCUENTOS);
    go("PRE-02");
  };

  return (
    <Screen id="PRE-01" name="Preparar: descontar insumos">
      <K.SectionTitle title={encabezado} />
      <K.Card
        thumb={r.imagen}
        title={r.nombre}
        sub={`${porciones} porciones planificadas`}
      />
      <View style={styles.rows}>
        <K.EditStepper
          label="Porciones preparadas"
          qty={porciones}
          onChange={(d) => setPorciones((p) => Math.max(1, Math.min(12, p + d)))}
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
