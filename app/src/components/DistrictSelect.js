import { useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from "react-native";
import Icon from "./Icon";
import { colors, spacing, typography, radius } from "../tokens";
import { focoVisible } from "../lib/a11y";
import { DISTRITOS_LIMA, buscarDistritos } from "../lib/distritos";

// Filtro con fallback por si buscarDistritos no llegara a cargar en algún entorno.
function filtrarDistritos(query) {
  const lista = Array.isArray(DISTRITOS_LIMA) ? DISTRITOS_LIMA : [];
  if (typeof buscarDistritos === "function") return buscarDistritos(query);
  const q = String(query || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (!q) return lista;
  return lista.filter((d) =>
    String(d).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
  );
}

// Select de distritos de Lima + Callao.
// Props:
//   value        string actual ("" si sin selección)
//   onChange     (distrito: string) => void  — "" para borrar
//   label        label visible (opcional)
//   placeholder  texto cuando no hay valor
//   allowClear   muestra "Sin distrito" cuando ya hay valor
export default function DistrictSelect({
  label = "Distrito",
  placeholder = "Seleccionar",
  value = "",
  onChange,
  allowClear = true,
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const filtrados = filtrarDistritos(busqueda);

  const elegir = (d) => {
    onChange && onChange(d);
    setAbierto(false);
    setBusqueda("");
  };

  const limpiar = () => {
    onChange && onChange("");
    setAbierto(false);
    setBusqueda("");
  };

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => setAbierto((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || "sin seleccionar"}`}
        accessibilityHint={
          abierto ? "Cierra la lista de distritos" : "Abre la lista de distritos de Lima"
        }
        accessibilityState={{ expanded: abierto }}
        style={(state) => [styles.trigger, state.pressed && styles.pressed, focoVisible(state)]}
      >
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Icon
          name={abierto ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.muted}
        />
      </Pressable>

      {abierto ? (
        <View style={styles.dropdown}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar distrito…"
            placeholderTextColor={colors.muted}
            value={busqueda}
            onChangeText={setBusqueda}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {allowClear && value ? (
            <Pressable
              onPress={limpiar}
              accessibilityRole="button"
              accessibilityLabel="Quitar distrito"
              style={(state) => [styles.clearRow, state.pressed && styles.pressed, focoVisible(state)]}
            >
              <Icon name="close-circle-outline" size={16} color={colors.red} />
              <Text style={styles.clearText}>Sin distrito</Text>
            </Pressable>
          ) : null}
          {filtrados.length === 0 ? (
            <Text style={styles.empty}>Sin coincidencias.</Text>
          ) : (
            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
              {filtrados.map((d) => {
                const activo = d === value;
                return (
                  <Pressable
                    key={d}
                    onPress={() => elegir(d)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: activo }}
                    accessibilityLabel={d}
                    style={(state) => [
                      styles.option,
                      activo && styles.optionActive,
                      state.pressed && styles.pressed,
                      focoVisible(state),
                    ]}
                  >
                    <Text style={[styles.optionText, activo && styles.optionTextActive]}>
                      {d}
                    </Text>
                    {activo ? <Icon name="checkmark" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: 46,
  },
  triggerText: { fontSize: typography.sizes.body, color: colors.text, flex: 1 },
  placeholder: { color: colors.muted },
  pressed: { opacity: 0.6 },
  dropdown: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: 6,
    gap: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    minHeight: 40,
    fontSize: typography.sizes.body,
    color: colors.text,
    backgroundColor: colors.field,
  },
  scroll: { maxHeight: 240 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    minHeight: 44,
  },
  optionActive: { backgroundColor: colors.primaryLight },
  optionText: { fontSize: typography.sizes.body, color: colors.text },
  optionTextActive: { fontWeight: typography.weights.semibold, color: colors.primary },
  clearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 40,
  },
  clearText: {
    fontSize: typography.sizes.body,
    color: colors.red,
    fontWeight: typography.weights.semibold,
  },
  empty: {
    fontSize: typography.sizes.body,
    color: colors.muted,
    textAlign: "center",
    paddingVertical: spacing.md,
  },
});