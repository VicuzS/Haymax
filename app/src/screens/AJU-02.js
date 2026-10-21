import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import Icon from "../components/Icon";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, spacing, typography } from "../tokens";
import useApi from "../hooks/useApi";
import { leerPreferencias, guardarPreferencias } from "../lib/preferencias";
import { anunciar, focoVisible } from "../lib/a11y";

const NOMBRE = "Exclusiones alimentarias";

const SUGERIDAS = [
  "arroz", "mariscos", "huevos", "gluten", "lactosa",
  "frutos secos", "cerdo", "picante", "azúcar",
];

const TIPOS = ["Pesados", "Picantes", "Fritos", "Muy condimentados"];

export default function AJU_02() {
  const { data, loading, recargar } = useApi(leerPreferencias);
  const prefs = data || { exclusiones: [], tiposExcluidos: [] };
  const exclusiones = prefs.exclusiones || [];
  const tiposExcluidos = prefs.tiposExcluidos || [];

  const [input, setInput] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const persistir = async (cambios) => {
    setError("");
    try {
      await guardarPreferencias(cambios);
      recargar({ silencioso: true });
    } catch (e) {
      setError((e && e.message) || "No se pudo guardar.");
    }
  };

  const agregar = (valor) => {
    const v = String(valor || "").trim().toLowerCase();
    if (!v || exclusiones.includes(v)) return;
    persistir({ exclusiones: [...exclusiones, v] });
    anunciar(`${v} agregado a exclusiones`);
  };

  const quitar = (valor) => {
    persistir({ exclusiones: exclusiones.filter((x) => x !== valor) });
    anunciar(`${valor} eliminado de exclusiones`);
  };

  const alternarTipo = (tipo) => {
    const ya = tiposExcluidos.includes(tipo);
    persistir({
      tiposExcluidos: ya
        ? tiposExcluidos.filter((x) => x !== tipo)
        : [...tiposExcluidos, tipo],
    });
    anunciar(`${tipo} ${ya ? "incluido" : "excluido"}`);
  };

  const agregarDesdeInput = () => {
    if (!input.trim()) return;
    agregar(input);
    setInput("");
  };

  const guardar = () => {
    if (guardando) return;
    setGuardando(true);
    anunciar("Exclusiones guardadas");
    go("AJU-01");
  };

  if (loading) {
    return (
      <Screen id="AJU-02" name={NOMBRE}>
        <K.Loading text="Cargando tus exclusiones…" />
      </Screen>
    );
  }

  const sugerenciasDisponibles = SUGERIDAS.filter((s) => !exclusiones.includes(s));

  return (
    <Screen id="AJU-02" name={NOMBRE}>
      <Text style={styles.intro}>
        Marca los ingredientes y tipos de plato que{" "}
        <Text style={styles.bold}>no quieres</Text> que te recomendemos.
      </Text>

      <K.SectionTitle title={`Tus exclusiones (${exclusiones.length})`} />
      {exclusiones.length === 0 ? (
        <Text style={styles.empty}>
          Aún no tienes exclusiones. Agrega una desde las sugerencias o escribe abajo.
        </Text>
      ) : (
        <View style={styles.chipsRow}>
          {exclusiones.map((x) => (
            <Pressable
              key={x}
              onPress={() => quitar(x)}
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${x}`}
              accessibilityHint="Toca para dejar de excluir este ingrediente"
              style={(state) => [
                styles.chipRemovable,
                state.pressed && styles.pressed,
                focoVisible(state),
              ]}
            >
              <Text style={styles.chipRemovableText}>{x}</Text>
              <Icon name="close" size={14} color={colors.white} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.addRow}>
        <View style={styles.addInput}>
          <K.InputField
            label="Agregar ingrediente"
            placeholder="Ej. cilantro"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={agregarDesdeInput}
            returnKeyType="done"
          />
        </View>
        <View style={styles.addButton}>
          <Button
            label="Agregar"
            full
            disabled={!input.trim()}
            onPress={agregarDesdeInput}
          />
        </View>
      </View>

      {sugerenciasDisponibles.length > 0 ? (
        <>
          <Text style={styles.subLabel} accessibilityRole="header">
            Sugerencias comunes
          </Text>
          <View style={styles.chipsRow}>
            {sugerenciasDisponibles.map((x) => (
              <Pressable
                key={x}
                onPress={() => agregar(x)}
                accessibilityRole="button"
                accessibilityLabel={`Agregar ${x}`}
                style={(state) => [
                  styles.chipSuggest,
                  state.pressed && styles.pressed,
                  focoVisible(state),
                ]}
              >
                <Icon name="add" size={14} color={colors.primary} />
                <Text style={styles.chipSuggestText}>{x}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <K.SectionTitle title="Tipos de plato a evitar" />
      <View style={styles.chipsRow}>
        {TIPOS.map((t) => {
          const activo = tiposExcluidos.includes(t);
          return (
            <Pressable
              key={t}
              onPress={() => alternarTipo(t)}
              accessibilityRole="checkbox"
              accessibilityLabel={t}
              accessibilityState={{ checked: activo }}
              style={(state) => [
                styles.chipTipo,
                activo && styles.chipTipoOn,
                state.pressed && styles.pressed,
                focoVisible(state),
              ]}
            >
              {activo ? <Icon name="checkmark" size={14} color={colors.white} /> : null}
              <Text style={[styles.chipTipoText, activo && styles.chipTipoTextOn]}>
                {t}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <K.Note text="Se aplican al motor de recetas, al planificador semanal y a la lista de compras." />
      {error ? <K.Note text={error} alerta /> : null}
      <Button label="Guardar y volver" full loading={guardando} onPress={guardar} />
      <K.LinkText
        label="Ver recetas que se verán afectadas"
        onPress={() => go("REC-01")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: typography.sizes.body, color: colors.sub, marginBottom: spacing.sm },
  bold: { fontWeight: typography.weights.bold, color: colors.text },
  empty: { fontSize: typography.sizes.body, color: colors.muted, marginBottom: spacing.sm },
  subLabel: {
    fontSize: typography.sizes.small,
    color: colors.muted,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipRemovable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 36,
  },
  chipRemovableText: {
    color: colors.white,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
  },
  chipSuggest: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 36,
  },
  chipSuggestText: {
    color: colors.primary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
  },
  chipTipo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 36,
  },
  chipTipoOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTipoText: { color: colors.text, fontSize: typography.sizes.body },
  chipTipoTextOn: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  addRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  addInput: { flex: 2 },
  addButton: { flex: 1, paddingBottom: 1 },
  pressed: { opacity: 0.7 },
});