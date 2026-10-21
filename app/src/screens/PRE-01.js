import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import useApi from "../hooks/useApi";
import { getPreparar, descontarAlCocinar, actualizarPlan } from "../lib/api";
import { escalarIngredientes } from "../lib/domain";
import { anunciar } from "../lib/a11y";

const NOMBRE = "Preparar: descontar insumos";
const HORARIO = { desayuno: "08:00", almuerzo: "13:00", cena: "20:00" };

export default function PRE_01({ receta }) {
  const { data, loading, error, recargar } = useApi(() => getPreparar(receta));
  const [porciones, setPorciones] = useState(null);
  const [guardo, setGuardo] = useState(false);
  // Una vez aplicado el descuento NUNCA se repite (evita descontar dos veces
  // si falla el segundo paso: marcar el plan como completado).
  const [descontado, setDescontado] = useState(false);
  // Confirmación explícita cuando el plato ya figura como preparado.
  const [repetido, setRepetido] = useState(false);
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
  const yaPreparado = !!(plan && plan.completado);
  const encabezado = plan
    ? `${plan.comida.toUpperCase()} · ${HORARIO[plan.comida] || "13:00"}`
    : "CENA · 20:00";
  const porc = porciones == null ? (plan ? plan.porciones : r.porciones) : porciones;
  // Misma función que PRE-02: lo que se descuenta aquí es lo que allí se ajusta.
  const descuentos = escalarIngredientes(r, porc);

  const confirmar = async () => {
    if (guardo) return;
    if (yaPreparado && !descontado && !repetido) {
      setRepetido(true);
      anunciar("Este plato ya se marcó como preparado. Toca de nuevo para descontar otra vez.");
      return;
    }
    setGuardo(true);
    setAviso("");
    let hecho = descontado;
    try {
      if (!hecho) {
        await descontarAlCocinar(descuentos);
        hecho = true;
        setDescontado(true);
      }
      if (plan && plan.id != null) {
        // Persona 4: marcar el plan como completado (receta del plan semanal).
        await actualizarPlan(plan.id, { completado: true });
      }
      go("PRE-02", { receta: r.id, porciones: String(porc) });
    } catch (e) {
      setAviso(
        hecho
          ? "Se descontaron los insumos, pero no se pudo marcar el plato como preparado. Reintenta: no se descontará dos veces."
          : (e && e.message) || "No se pudo descontar de la despensa."
      );
      setGuardo(false);
    }
  };

  const etiquetaBoton = guardo
    ? "Guardando…"
    : descontado
      ? "Reintentar marcar como preparado"
      : repetido
        ? "Toca de nuevo para descontar otra vez"
        : "Confirmar y descontar de despensa";

  return (
    <Screen id="PRE-01" name={NOMBRE}>
      <K.SectionTitle title={encabezado} />
      <K.Card thumb={r.imagen} title={r.nombre} sub={`${porc} porciones planificadas`} />
      {yaPreparado && !descontado ? (
        <K.Banner
          title="Este plato ya se marcó como preparado"
          sub="Si lo confirmas otra vez, se descontarán los insumos de nuevo."
          tone="PRIMARY"
        />
      ) : null}
      <View style={styles.rows}>
        <K.EditStepper
          label="Porciones preparadas"
          qty={porc}
          onChange={descontado ? undefined : (d) => setPorciones(Math.max(1, Math.min(12, porc + d)))}
        />
      </View>

      <K.SectionTitle title="Insumos a descontar" />
      <View style={styles.rows}>
        {descuentos.map((ing) => (
          <K.Row key={ing.id} label={ing.label} value={`${ing.qty} ${ing.unit}`} />
        ))}
      </View>
      <K.Note text="¿Usaste otra cantidad o un ingrediente extra? Podrás ajustarlo en el siguiente paso." />

      <Button label={etiquetaBoton} full loading={guardo} onPress={confirmar} />
      <K.LinkText label="Omitir por ahora" align="CENTER" onPress={() => go("PLA-05")} />
      {aviso ? <K.Banner title={aviso} tone="RED" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
