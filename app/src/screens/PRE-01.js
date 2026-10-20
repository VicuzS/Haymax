import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import useApi from "../hooks/useApi";
import { getPreparar, descontarAlCocinar, actualizarPlan } from "../lib/api";

const NOMBRE = "Preparar: descontar insumos";
const HORARIO = { desayuno: "08:00", almuerzo: "13:00", cena: "20:00" };

// Descuentos reales de la receta (ingredientes estructurados de la API),
// escalados a las porciones que efectivamente se preparan.
function descuentosDe(receta, porc) {
  if (!receta) return [];
  const base = receta.porciones > 0 ? porc / receta.porciones : 1;
  const detalle = receta.ingredientes_detalle || [];
  if (detalle.length) {
    return detalle
      .map((ing, i) => ({
        id: "D" + i,
        label: ing.nombre,
        qty: Math.max(1, Math.round((Number(ing.cantidad) || 0) * base)),
        unit: ing.unidad_medida || "und",
      }))
      .filter((d) => d.qty > 0);
  }
  // Fallback: texto plano "400 gr de Lomo fino" -> { cantidad, unidad }.
  return (receta.ingredientes || [])
    .map((texto, i) => {
      const m = String(texto).match(/([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-Z]+)?/);
      return {
        id: "D" + i,
        label: String(texto).replace(/^[0-9.,]+\s*[a-zA-Z]*\s*(de\s+)?/i, "").trim(),
        qty: m ? Number(m[1].replace(",", ".")) : 1,
        unit: (m && m[2] && m[2].toLowerCase()) || "und",
      };
    })
    .filter((d) => d.label);
}

export default function PRE_01({ receta }) {
  const { data, loading, error, recargar } = useApi(() => getPreparar(receta));
  const [porciones, setPorciones] = useState(null);
  const [guardo, setGuardo] = useState(false);
  const [aviso, setAviso] = useState("");

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
  const descuentos = descuentosDe(r, porc);

  const confirmar = async () => {
    if (guardo) return;
    setGuardo(true);
    setAviso("");
    try {
      await descontarAlCocinar(descuentos);
      if (plan && plan.id != null) {
        // Persona 4: marcar el plan como completado (recta del plan semanal).
        await actualizarPlan(plan.id, { completado: true });
      }
      go("PRE-02", { receta: r.id, porciones: String(porc) });
    } catch (e) {
      setAviso((e && e.message) || "No se pudo descontar de la despensa.");
      setGuardo(false);
    }
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
        {descuentos.slice(0, 6).map((ing) => (
          <K.Row key={ing.label} label={ing.label} value={`${ing.qty} ${ing.unit}`} />
        ))}
      </View>
      <K.InputField placeholder="¿Usaste algún ingrediente extra?" />

      <Button label={guardo ? "Guardando…" : "Confirmar y descontar de despensa"} full onPress={confirmar} />
      <K.LinkText label="Omitir por ahora" align="CENTER" onPress={() => go("PLA-05")} />
      {aviso ? <K.Banner title={aviso} tone="RED" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
