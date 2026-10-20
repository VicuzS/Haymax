import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import useApi from "../hooks/useApi";
import { getPreparar, ajustarAlCocinar } from "../lib/api";

const PASO = (unit) => (unit === "gr" || unit === "g" || unit === "ml" ? 50 : 1);

// Filas reales de la receta (ingredientes de la API), escaladas a porciones.
function filasDe(receta, porc) {
  if (!receta) return [];
  const base = receta.porciones > 0 ? porc / receta.porciones : 1;
  const detalle = receta.ingredientes_detalle || [];
  if (detalle.length) {
    return detalle.map((ing, i) => {
      const qty = Math.max(0, Math.round((Number(ing.cantidad) || 0) * base));
      const unit = ing.unidad_medida || "und";
      return { id: "D" + i, label: ing.nombre, qty, base: qty, unit };
    });
  }
  return (receta.ingredientes || [])
    .map((texto, i) => {
      const m = String(texto).match(/([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-Z]+)?/);
      const qty = m ? Number(m[1].replace(",", ".")) : 1;
      const unit = (m && m[2] && m[2].toLowerCase()) || "und";
      const label = String(texto).replace(/^[0-9.,]+\s*[a-zA-Z]*\s*(de\s+)?/i, "").trim();
      return { id: "D" + i, label, qty, base: qty, unit };
    })
    .filter((f) => f.label);
}

export default function PRE_02({ receta, porciones }) {
  const { data, loading, error, recargar } = useApi(() => getPreparar(receta));
  const cambio = filasDe(data && data.receta, Number(porciones) || 0);
  const [filas, setFilas] = useState(null);
  const [aviso, setAviso] = useState("");
  const [guardo, setGuardo] = useState(false);

  if (loading) {
    return (
      <Screen id="PRE-02" name="Despensa actualizada (cantidades)">
        <K.Loading text="Ajustando cantidades…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="PRE-02" name="Despensa actualizada (cantidades)">
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const filasActuales = filas || cambio;

  const cambiar = (id, d) =>
    setFilas(
      filasActuales.map((f) => (f.id === id ? { ...f, qty: Math.max(0, f.qty + d * PASO(f.unit)) } : f))
    );

  const confirmar = async () => {
    if (guardo) return;
    setGuardo(true);
    setAviso("");
    try {
      await ajustarAlCocinar(filasActuales);
      go("DES-01");
    } catch (e) {
      setAviso((e && e.message) || "No se pudo actualizar la despensa.");
      setGuardo(false);
    }
  };

  return (
    <Screen id="PRE-02" name="Despensa actualizada (cantidades)">
      <K.CheckCircle title="Despensa actualizada" />
      <K.SectionTitle title="Insumos descontados" />
      {filasActuales.length === 0 ? (
        <K.TextLine text="Esta receta no registró insumos a descontar." />
      ) : (
        <View style={styles.rows}>
          {filasActuales.map((f) => (
            <K.EditStepper
              key={f.id}
              label={f.label}
              qty={`${f.qty} ${f.unit}`}
              onChange={(d) => cambiar(f.id, d)}
            />
          ))}
        </View>
      )}
      <K.Note text="¿Usaste otra cantidad? Ajústala con − / + antes de salir." />
      <Button label={guardo ? "Guardando…" : "Confirmar cantidades"} full onPress={confirmar} />
      <Button label="Ver resumen de salud" variant="outline" full onPress={() => go("SAL-01")} />
      <K.LinkText label="Volver a mi plan" align="CENTER" onPress={() => go("PLA-05")} />
      {aviso ? <K.Banner title={aviso} tone="RED" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
