import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import useApi from "../hooks/useApi";
import { getPreparar, ajustarAlCocinar, deshacerPreparacion, getUltimoDescuento, limpiarUltimoDescuento } from "../lib/api";
import { escalarIngredientes, familiaUnidad } from "../lib/domain";
import { anunciar } from "../lib/a11y";

const NOMBRE = "Despensa actualizada (cantidades)";

// Paso del "−/+" según la unidad: gramos/ml de 50 en 50, kg/l de 0,25, el resto de 1 en 1.
function paso(unit) {
  const f = familiaUnidad(unit);
  if (f === "peso" || f === "volumen") return ["kg", "kilo", "kilos", "l", "lt", "litro", "litros"].includes(String(unit).toLowerCase()) ? 0.25 : 50;
  return 1;
}

export default function PRE_02({ receta, porciones }) {
  const { data, loading, error, recargar } = useApi(() => getPreparar(receta));
  const [filas, setFilas] = useState(null);
  const [aviso, setAviso] = useState("");
  const [guardo, setGuardo] = useState(false);

  if (loading) {
    return (
      <Screen id="PRE-02" name={NOMBRE}>
        <K.Loading text="Ajustando cantidades…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="PRE-02" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const porc = Number(porciones) || (data.plan && data.plan.porciones) || data.receta.porciones || 1;
  // `base` = lo que ya se descontó en PRE-01 (misma función, mismas cantidades).
  const base = escalarIngredientes(data.receta, porc).map((d) => ({ ...d, base: d.qty }));
  const filasActuales = filas || base;
  const reporte = getUltimoDescuento();

  const cambiar = (id, d) => {
    const nuevas = filasActuales.map((f) =>
      f.id === id ? { ...f, qty: Math.max(0, Math.round((f.qty + d * paso(f.unit)) * 1000) / 1000) } : f
    );
    setFilas(nuevas);
  };

  const confirmar = async () => {
    if (guardo) return;
    setGuardo(true);
    setAviso("");
    try {
      await ajustarAlCocinar(filasActuales);
      limpiarUltimoDescuento();
      anunciar("Cantidades confirmadas.");
      go("DES-01");
    } catch (e) {
      setAviso((e && e.message) || "No se pudo actualizar la despensa.");
      setGuardo(false);
    }
  };

  // CU-05 "Deshacer": restaura la despensa y devuelve el plato al plan de hoy.
  const deshacer = async () => {
    if (guardo) return;
    setGuardo(true);
    setAviso("");
    try {
      await deshacerPreparacion({ filas: base, planId: data.plan ? data.plan.id : undefined });
      anunciar("Se restauró tu despensa y el plato volvió a tu plan.");
      go("INI-01");
    } catch (e) {
      setAviso((e && e.message) || "No se pudo deshacer. Inténtalo de nuevo.");
      setGuardo(false);
    }
  };

  return (
    <Screen id="PRE-02" name={NOMBRE}>
      <K.CheckCircle title="Despensa actualizada" />
      {reporte && reporte.noEncontrados.length > 0 ? (
        <K.Note
          alerta
          text={`No se encontró en tu despensa, así que no se descontó: ${reporte.noEncontrados.join(", ")}.`}
        />
      ) : null}
      {reporte && reporte.insuficientes.length > 0 ? (
        <K.Note
          alerta
          text={`Stock insuficiente, quedó en 0: ${reporte.insuficientes
            .map((i) => `${i.label} (faltaban ${i.faltante} ${i.unit})`)
            .join(", ")}.`}
        />
      ) : null}
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
      <K.Note text="¿Usaste otra cantidad? Ajústala con − / + y confirma antes de salir." />
      <Button label={guardo ? "Guardando…" : "Confirmar cantidades"} full loading={guardo} onPress={confirmar} />
      <Button label="Deshacer y restaurar despensa" variant="outline" full disabled={guardo} onPress={deshacer} />
      <Button label="Ver resumen de salud" variant="ghost" full onPress={() => go("SAL-01")} />
      <K.LinkText label="Volver a mi plan" align="CENTER" onPress={() => go("PLA-05")} />
      {aviso ? <K.Banner title={aviso} tone="RED" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
