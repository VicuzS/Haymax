import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import useApi from "../hooks/useApi";
import { getReceta, planificarPlato, actualizarPlan } from "../lib/api";
import { fechaCorta, fechaLarga } from "../lib/fechas";

const NOMBRE = "Planificar: conflicto de horario";

export default function PLA_04({ receta, plan: planPrevio, porciones, fecha, comida = "almuerzo", dia }) {
  const { data, loading, error, recargar } = useApi(() => getReceta(receta));
  const [opcion, setOpcion] = useState(0);
  const [guardo, setGuardo] = useState(false);
  const [aviso, setAviso] = useState("");

  if (loading) {
    return (
      <Screen id="PLA-04" name={NOMBRE}>
        <K.Loading text="Revisando tu plan…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="PLA-04" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const r = data.receta;
  const porc = Number(porciones) || r.porciones;
  const cuando = dia || (fecha ? fechaCorta(fecha) : "ese día");

  const confirmar = async () => {
    if (guardo) return;
    setGuardo(true);
    setAviso("");
    try {
      if (opcion === 0) {
        // Reemplaza el plato anterior por el nuevo (PUT del plan previo).
        await actualizarPlan(planPrevio, { recetaId: r.id, fecha, comida, porciones: porc });
      } else {
        // Deja los dos platos: se agrega el nuevo además del previo.
        await planificarPlato({ recetaId: r.id, fecha, comida, porciones: porc });
      }
      go("PLA-02", { receta: r.id, porciones: String(porc), dia: fecha ? fechaLarga(fecha) : dia });
    } catch (e) {
      setAviso((e && e.message) || "No se pudo guardar la elección.");
    } finally {
      setGuardo(false);
    }
  };

  return (
    <Screen id="PLA-04" name={NOMBRE}>
      <K.Banner
        title={`Ya tienes ${r.nombre} reservado para el ${cuando}`}
        sub="Elige qué hacer con el plato nuevo"
        tone="PRIMARY"
      />
      <K.RadioOption
        title="Quitar el plato anterior"
        sub="Solo quedará el plato nuevo"
        selected={opcion === 0}
        onPress={() => setOpcion(0)}
      />
      <K.RadioOption
        title="Dejar los dos platos"
        sub="Habrá dos platos para esa comida"
        selected={opcion === 1}
        onPress={() => setOpcion(1)}
      />
      <K.Note text="Ambas opciones mantienen tus porciones y tu lista." />
      <View style={styles.rows}>
        <Button label={guardo ? "Guardando…" : "Confirmar"} full onPress={confirmar} />
      </View>
      {aviso ? <K.Banner title={aviso} tone="RED" /> : null}
      <K.LinkText label="Cancelar" align="CENTER" onPress={() => go("PLA-01", { receta: r.id, fecha })} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
