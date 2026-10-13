import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import useApi from "../hooks/useApi";
import { getReceta, planificarPlato } from "../lib/api";

const NOMBRE = "Planificar: paso 1 de 2";
const DIAS = ["Hoy", "Mañana", "Sábado", "Próx. lunes"];
const DIAS_ES = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

function diaReal(chip) {
  const hoy = new Date().getDay();
  if (chip === "Hoy") return DIAS_ES[hoy];
  if (chip === "Mañana") return DIAS_ES[(hoy + 1) % 7];
  if (chip === "Sábado") return "sabado";
  return "lunes";
}

export default function PLA_01({ receta }) {
  const { data, loading, error, recargar } = useApi(() => getReceta(receta));
  const [dia, setDia] = useState("Hoy");
  const [porciones, setPorciones] = useState(null);

  if (loading) {
    return (
      <Screen id="PLA-01" name={NOMBRE}>
        <K.Loading text="Cargando…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="PLA-01" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const r = data.receta;
  const porc = porciones == null ? r.porciones : porciones;

  const confirmar = async () => {
    await planificarPlato({ recetaId: r.id, dia: diaReal(dia), porciones: porc });
    go("PLA-02", { receta: r.id, porciones: String(porc), dia });
  };

  return (
    <Screen id="PLA-01" name={NOMBRE}>
      <K.SectionTitle title="Paso 1 de 2" />
      <K.Card
        thumb={r.imagen}
        title={r.nombre}
        sub={`${r.porciones} porciones · ${r.minutos} min`}
        right="Cambiar"
        onPress={() => go("REC-02", { receta: r.id })}
      />

      <K.SectionTitle title="¿Para cuándo lo planeas?" />
      <K.Chips items={DIAS} active={dia} onPressItem={setDia} />
      <K.TextLine text="La semana completa se edita en tu plan (7 días)." />
      <View style={styles.rows}>
        <K.EditStepper
          label="Porciones"
          qty={porc}
          onChange={(d) => setPorciones(Math.max(1, Math.min(12, porc + d)))}
        />
      </View>
      <K.Note text="Recalcularemos insumos y lista de compras automáticamente." />

      <Button label="Confirmar porciones" full onPress={confirmar} />
      <K.LinkText label="Ver resultado con faltantes (demo)" align="CENTER" onPress={() => go("PLA-03", { receta: r.id })} />
      <K.LinkText label="Ver conflicto de horario (demo)" align="CENTER" onPress={() => go("PLA-04")} />
      <K.LinkText label="Cancelar" align="CENTER" onPress={() => go("INI-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
