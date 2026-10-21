import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import Icon from "../components/Icon";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, spacing, typography } from "../tokens";
import useApi from "../hooks/useApi";
import { getDespensa } from "../lib/api";
import { focoVisible } from "../lib/a11y";

const NOMBRE = "Mi despensa";
const CATS = ["Todos", "Verduras", "Lácteos", "Secos", "Carnes"];
const CAT_ICON = {
  Verduras: "leaf-outline",
  Lácteos: "water-outline",
  Secos: "cube-outline",
  Carnes: "restaurant-outline",
};

const ESTADO = {
  ok: { label: null },
  "por-vencer": { label: "Por vencer", color: colors.amber, bg: colors.amberBg },
  vencido: { label: "Vencido", color: colors.red, bg: colors.redBg },
};

function cantidadTexto(p) {
  const cant = p.cantidad != null ? String(p.cantidad).trim() : "";
  const unidad = p.unidad ? String(p.unidad).trim() : "";
  if (!cant) return unidad;
  if (!unidad) return cant;
  return /\s+[a-zA-Z]/.test(cant) ? cant : `${cant} ${unidad}`;
}

export default function DES_01() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todos");
  const { data, loading, error, recargar } = useApi(getDespensa);

  if (loading) {
    return (
      <Screen id="DES-01" name={NOMBRE}>
        <K.Loading text="Cargando tu despensa…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="DES-01" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const { items, stats } = data;
  const lista = items.filter((p) => {
    const okCat = cat === "Todos" || p.categoria === cat;
    const okQ = p.nombre.toLowerCase().includes(q.trim().toLowerCase());
    return okCat && okQ;
  });

  const alertas = stats.porVencer + stats.vencidos;

  return (
    <Screen id="DES-01" name={NOMBRE}>      
    <K.InputField
        label="Buscar insumo"
        placeholder="Ej. pollo, tomate…"
        value={q}
        onChangeText={setQ}
      />
      <K.Chips
        items={CATS}
        active={cat}
        onPressItem={setCat}
        hintItem="Filtra por categoría"
      />
      <Button label="Agregar insumos" full onPress={() => go("DES-03")} />

      <Text style={styles.hint}>
        {lista.length} insumo{lista.length === 1 ? "" : "s"} · Toca uno para editar
      </Text>
      {lista.length === 0 ? (
        <K.EmptyState
          title="Sin resultados"
          sub="Prueba otra categoría o limpia la búsqueda."
        />
      ) : (
        lista.map((p) => (
          <InsumoRow
            key={p.id}
            insumo={p}
            onPress={() => go("DES-02", { insumo: p.id })}
          />
        ))
      )}

      <K.Note
        text={
          alertas > 0
            ? `${alertas} insumo${alertas === 1 ? "" : "s"} vence${alertas === 1 ? "" : "n"} en menos de 3 días. Toca para revisar.`
            : "Ningún insumo está por vencer."
        }
        onPress={alertas > 0 ? () => go("PRE-03") : undefined}
        alerta={alertas > 0}
      />
      <K.LinkText
        label="Lo que falta está en tu lista de compras →"
        align="CENTER"
        onPress={() => go("COM-01")}
      />
    </Screen>
  );
}

function InsumoRow({ insumo, onPress }) {
  const est = ESTADO[insumo.estado] || ESTADO.ok;
  const valor = cantidadTexto(insumo);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${insumo.nombre}, ${valor}${est.label ? `, ${est.label}` : ""}`}
      accessibilityHint="Abre los detalles para editar"
      style={(state) => [
        styles.row,
        state.pressed && styles.pressed,
        focoVisible(state),
      ]}
    >
      <View style={styles.iconBox}>
        <Icon
          name={CAT_ICON[insumo.categoria] || "cube-outline"}
          size={18}
          color={colors.primary}
        />
      </View>
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={2}>
          {insumo.nombre}
        </Text>
        <Text style={styles.valor}>{valor}</Text>
      </View>
      {est.label ? (
        <View style={[styles.badge, { backgroundColor: est.bg }]}>
          <Text style={[styles.badgeText, { color: est.color }]}>{est.label}</Text>
        </View>
      ) : null}
      <Icon name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: typography.sizes.small,
    color: colors.muted,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { opacity: 0.6 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  main: { flex: 1, gap: 2 },
  name: {
    fontSize: 15,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  valor: {
    fontSize: 13,
    color: colors.sub,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 4,
  },
  badgeText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
});