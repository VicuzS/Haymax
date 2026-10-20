import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import useApi from "../hooks/useApi";
import { getReceta, planificarPlato, actualizarPlan, getPlanesEntre } from "../lib/api";
import { hoyIso, sumarDiasIso, lunesDeIso } from "../lib/fechas";

const NOMBRE = "Planificar: paso 1 de 2";
const DIAS = ["Hoy", "Mañana", "Sábado", "Próx. lunes"];
const COMIDAS = [
  ["Desayuno", "desayuno"],
  ["Almuerzo", "almuerzo"],
  ["Cena", "cena"],
];

// Chip -> fecha real ('YYYY-MM-DD'), siempre hacia el futuro.
function isoPorChip(chip) {
  const hoy = hoyIso();
  if (chip === "Hoy") return hoy;
  if (chip === "Mañana") return sumarDiasIso(hoy, 1);
  if (chip === "Sábado") {
    const sab = sumarDiasIso(lunesDeIso(hoy), 5);
    return sab < hoy ? sumarDiasIso(sab, 7) : sab;
  }
  return sumarDiasIso(lunesDeIso(hoy), 7); // Próx. lunes
}

// 'YYYY-MM-DD' -> chip equivalente (o null si no hay coincidencia).
function chipPorIso(iso, planId) {
  if (!iso || planId == null) return null; // editar: mantiene la fecha guardada hasta que se cambie
  const hoy = hoyIso();
  if (iso === hoy) return "Hoy";
  if (iso === sumarDiasIso(hoy, 1)) return "Mañana";
  if (iso === sumarDiasIso(lunesDeIso(hoy), 5)) return "Sábado";
  if (iso === sumarDiasIso(lunesDeIso(hoy), 7)) return "Próx. lunes";
  return null;
}

export default function PLA_01({ receta, plan: planId, porciones: porcGuardadas, fecha, comida: comidaGuardada }) {
  const { data, loading, error, recargar } = useApi(() => getReceta(receta));
  const [dia, setDia] = useState(() => chipPorIso(fecha, planId == null ? undefined : planId) || (planId == null ? "Hoy" : null));
  const [comida, setComida] = useState(comidaGuardada || "almuerzo");
  const [porciones, setPorciones] = useState(porcGuardadas != null ? Number(porcGuardadas) : null);
  const [guardo, setGuardo] = useState(false);
  const [aviso, setAviso] = useState("");

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
  const porc = porciones == null ? (porcGuardadas != null ? Number(porcGuardadas) : r.porciones) : porciones;

  const confirmar = async () => {
    if (guardo) return;
    setGuardo(true);
    setAviso("");
    try {
      const fechaFinal = dia ? isoPorChip(dia) : fecha;
      if (planId != null) {
        // Edición de un plato existente: PUT parcial al plan.
        await actualizarPlan(planId, { recetaId: r.id, fecha: fechaFinal, comida, porciones: porc });
      } else {
        // Alta nueva: detectamos conflicto con otro plato del mismo día y comida.
        const delDia = await getPlanesEntre(fechaFinal, fechaFinal);
        const conflicto = (delDia || []).find((p) => p.comida === comida && p.receta_id !== r.id);
        if (conflicto) {
          go("PLA-04", { receta: r.id, porciones: String(porc), fecha: fechaFinal, plan: conflicto.id, comida });
          return;
        }
        await planificarPlato({ recetaId: r.id, fecha: fechaFinal, comida, porciones: porc });
      }
      go("PLA-02", { receta: r.id, porciones: String(porc), dia: dia || fecha, comida });
    } catch (e) {
      setAviso((e && e.message) || "No se pudo guardar en tu plan. Revisa tu conexión con la API.");
    } finally {
      setGuardo(false);
    }
  };

  return (
    <Screen id="PLA-01" name={NOMBRE}>
      <K.SectionTitle title={planId != null ? "Paso 1 de 2 · editar plan" : "Paso 1 de 2"} />
      <K.Card
        thumb={r.imagen}
        title={r.nombre}
        sub={`${r.porciones} porciones · ${r.minutos} min`}
        right="Cambiar"
        onPress={() => go("REC-02", { receta: r.id })}
      />

      <K.SectionTitle title="¿Para cuándo lo planeas?" />
      <K.Chips
        items={DIAS}
        active={dia || undefined}
        onPressItem={(c) => {
          setDia(c);
          setAviso("");
        }}
      />
      <K.TextLine text="La semana completa se edita en tu plan (7 días)." />
      <K.Chips
        items={COMIDAS.map((c) => c[0])}
        active={(COMIDAS.find((c) => c[1] === comida) || COMIDAS[1])[0]}
        onPressItem={(label) => {
          const c = COMIDAS.find((x) => x[0] === label);
          if (c) setComida(c[1]);
        }}
      />
      <View style={styles.rows}>
        <K.EditStepper
          label="Porciones"
          qty={porc}
          onChange={(d) => setPorciones(Math.max(1, Math.min(12, porc + d)))}
        />
      </View>
      <K.Note text="Recalcularemos insumos y lista de compras automáticamente." />

      <Button label={guardo ? "Guardando…" : "Confirmar porciones"} full onPress={confirmar} />
      <K.LinkText label="Ver resultado con faltantes (demo)" align="CENTER" onPress={() => go("PLA-03", { receta: r.id })} />
      <K.LinkText label="Cancelar" align="CENTER" onPress={() => go("PLA-05")} />
      {aviso ? <K.Banner title={aviso} tone="RED" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
