import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, spacing } from "../tokens";
import useApi from "../hooks/useApi";
import { getAlertas, eliminarInsumo } from "../lib/api";
import { diasHasta, textoVencimiento } from "../lib/fechas";
import { anunciar } from "../lib/a11y";

const NOMBRE = "Alerta: insumos por vencer";

export default function PRE_03() {
  const { data, loading, error, recargar } = useApi(getAlertas);
  const [ocupado, setOcupado] = useState(null);
  const [resultado, setResultado] = useState(null); // { texto, error }

  if (loading) {
    return (
      <Screen id="PRE-03" name={NOMBRE}>
        <K.Loading text="Revisando tu despensa…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="PRE-03" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const atencion = data.atencion;
  const recetas = data.recetas || [];

  // HU-05: el insumo se marca como usado o descartado desde la misma alerta.
  const quitar = async (p, motivo) => {
    if (ocupado != null) return;
    setOcupado(p.id);
    try {
      await eliminarInsumo(p.id);
      const texto = motivo === "usado" ? `${p.nombre} marcado como usado.` : `${p.nombre} descartado de tu despensa.`;
      setResultado({ texto, error: false });
      anunciar(texto);
      recargar({ silencioso: true });
    } catch (e) {
      const texto = (e && e.message) || "No se pudo actualizar el insumo.";
      setResultado({ texto, error: true });
      anunciar(texto);
    } finally {
      setOcupado(null);
    }
  };

  return (
    <Screen id="PRE-03" name={NOMBRE}>
      <K.Banner
        title={atencion.length > 0 ? `Vencen pronto · ${atencion.length} insumos` : "Sin alertas de vencimiento"}
        sub="Revísalos hoy para no desperdiciarlos"
        tone="PRIMARY"
      />
      {resultado ? <K.Banner title={resultado.texto} tone={resultado.error ? "RED" : "GREEN"} /> : null}

      {atencion.length === 0 ? (
        <K.EmptyState title="Nada por vencer" sub="Tu despensa está al día." />
      ) : (
        <>
          <K.SectionTitle title="Usarlos ya" />
          {atencion.map((p) => {
            const vencido = p.estado === "vencido";
            const dias = p.fechaVencimiento ? diasHasta(p.fechaVencimiento) : null;
            const estado = dias == null ? (vencido ? "Vencido — úsalo hoy" : "Por vencer") : textoVencimiento(dias);
            return (
              <View key={p.id} style={styles.item}>
                <K.Card
                  title={`${p.nombre} · ${p.cantidad} ${p.unidad}`}
                  sub={estado}
                  subColor={vencido ? colors.red : colors.amber}
                />
                <View style={styles.acciones}>
                  <View style={styles.accion}>
                    <Button
                      label="Usado"
                      variant="outline"
                      compact
                      full
                      disabled={ocupado === p.id}
                      accessibilityLabel={`Marcar ${p.nombre} como usado`}
                      onPress={() => quitar(p, "usado")}
                    />
                  </View>
                  <View style={styles.accion}>
                    <Button
                      label="Descartar"
                      variant="danger"
                      compact
                      full
                      disabled={ocupado === p.id}
                      accessibilityLabel={`Descartar ${p.nombre}`}
                      onPress={() => quitar(p, "descartado")}
                    />
                  </View>
                  <View style={styles.accion}>
                    <Button
                      label="Editar"
                      variant="ghost"
                      compact
                      full
                      accessibilityLabel={`Editar ${p.nombre}`}
                      onPress={() => go("DES-02", { insumo: p.id })}
                    />
                  </View>
                </View>
              </View>
            );
          })}

          {recetas.length > 0 ? (
            <>
              <K.SectionTitle title="Recetas que los aprovechan" />
              {recetas.map(({ receta: r, usados }) => (
                <K.Card
                  key={r.id}
                  title={r.nombre}
                  sub={`Usa: ${usados.join(", ")}`}
                  right="Ver"
                  onPress={() => go("REC-02", { receta: r.id })}
                />
              ))}
            </>
          ) : null}
        </>
      )}

      <Button label="Ver más recetas posibles" full onPress={() => go("REC-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { gap: spacing.sm, marginBottom: spacing.sm },
  acciones: { flexDirection: "row", gap: spacing.sm },
  accion: { flex: 1 },
});
