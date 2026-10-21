import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import Icon from "../components/Icon";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, spacing, typography } from "../tokens";
import useApi from "../hooks/useApi";
import { anunciar, focoVisible } from "../lib/a11y";
import {
  getCompras,
  setCompraListo,
  crearItemCompra,
  quitarCompra,
  quitarComprados,
  generarListaCompras,
} from "../lib/api";

const NOMBRE = "Lista de compras";
// Orden preferido de secciones; las demás se agregan al final.
const PRINCIPALES = ["Mercado de abastos", "Supermercado"];

// "500 g" + "gr" → "500 g" (evita duplicar la unidad cuando ya está en la cantidad).
// "2" + "kg" → "2 kg".
function valorDe(it) {
  const cant = it.cantidad != null ? String(it.cantidad).trim() : "";
  const unidad = it.unidad_medida ? String(it.unidad_medida).trim() : "";
  if (!cant) return unidad;
  if (!unidad) return cant;
  return /\s+[a-zA-Z]/.test(cant) ? cant : `${cant} ${unidad}`;
}

export default function COM_01() {
  const { data, loading, error, recargar } = useApi(getCompras);
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");

  if (loading) {
    return (
      <Screen id="COM-01" name={NOMBRE}>
        <K.Loading text="Cargando tu lista…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="COM-01" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const { items, prog } = data;

  const secciones = [
    ...PRINCIPALES.filter((sec) => items.some((i) => i.seccion === sec)),
    ...Array.from(new Set(items.map((i) => i.seccion).filter((sec) => PRINCIPALES.indexOf(sec) === -1))),
  ];

  const conError = (e) => setAviso((e && e.message) || "Algo salió mal. Revisa tu conexión con la API.");

  const toggle = async (it) => {
    if (ocupado) return;
    setOcupado(true);
    try {
      await setCompraListo(it.id, !it.listo);
      anunciar(it.listo ? `${it.nombre} sin marcar` : `${it.nombre} marcado como comprado`);
      setAviso("");
      recargar({ silencioso: true });
    } catch (e) {
      conError(e);
    } finally {
      setOcupado(false);
    }
  };

  const agregar = async () => {
    if (ocupado || !nombre.trim()) return;
    setOcupado(true);
    try {
      await crearItemCompra({ nombre, cantidad });
      anunciar(`${nombre.trim()} agregado a la lista`);
      setNombre("");
      setCantidad("");
      setAviso("");
      recargar({ silencioso: true });
    } catch (e) {
      conError(e);
    } finally {
      setOcupado(false);
    }
  };

  const limpiarComprados = async () => {
    if (ocupado) return;
    setOcupado(true);
    try {
      await quitarComprados();
      anunciar("Ítems comprados eliminados");
      setAviso("");
      recargar({ silencioso: true });
    } catch (e) {
      conError(e);
    } finally {
      setOcupado(false);
    }
  };

  const generar = async () => {
    if (ocupado) return;
    setOcupado(true);
    try {
      await generarListaCompras();
      anunciar("Lista generada desde tu plan de la semana");
      setAviso("");
      recargar({ silencioso: true });
    } catch (e) {
      conError(e);
    } finally {
      setOcupado(false);
    }
  };

  const quitarUno = async (it) => {
    if (ocupado) return;
    setOcupado(true);
    try {
      await quitarCompra(it.id);
      anunciar(`${it.nombre} eliminado de la lista`);
      setAviso("");
      recargar({ silencioso: true });
    } catch (e) {
      conError(e);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Screen id="COM-01" name={NOMBRE}>
      <K.Progress
        label="Tu lista de compras"
        right={`${prog.listos} de ${prog.total} ítems`}
        pct={prog.pct}
      />

      {prog.listos > 0 ? (
        <K.Note
          text={`${prog.listos} ítem${prog.listos === 1 ? "" : "s"} ya marcado${
            prog.listos === 1 ? "" : "s"
          } como comprado${prog.listos === 1 ? "" : "s"}. Toca aquí para limpiarlos.`}
          onPress={limpiarComprados}
        />
      ) : null}
<K.SectionTitle title="Agregar a la lista de compras" />
      <K.InputField
        label="Producto"
        placeholder="Ej. Salsa de soya"
        value={nombre}
        onChangeText={setNombre}
      />
      <View style={styles.filaQty}>
        <View style={styles.campoQty}>
          <K.InputField
            placeholder="Cantidad (p. ej. 2 kg)"
            value={cantidad}
            onChangeText={setCantidad}
          />
        </View>
        <View style={styles.botonQty}>
          <Button
            label="Agregar"
            full
            disabled={ocupado || !nombre.trim()}
            onPress={agregar}
          />
        </View>
      </View>

      {secciones.map((sec) => {
        const grupo = items.filter((i) => i.seccion === sec);
        if (grupo.length === 0) return null;
        const listos = grupo.filter((i) => i.listo).length;
        return (
          <View key={sec} style={styles.grupo}>
            <View style={styles.seccionHead}>
              <Text style={styles.seccionTitle} accessibilityRole="header">
                {sec}
              </Text>
              <Text style={styles.seccionCount}>
                {listos} de {grupo.length}
              </Text>
            </View>
            <View style={styles.rows}>
              {grupo.map((it) => (
                <ItemRow
                  key={it.id}
                  it={it}
                  valor={valorDe(it)}
                  onToggle={() => toggle(it)}
                  onDelete={() => quitarUno(it)}
                  disabled={ocupado}
                />
              ))}
            </View>
          </View>
        );
      })}

      <Button label="Generar desde mi plan de la semana" full onPress={generar} />
      <Button
        label="Registrar compra escaneada"
        variant="outline"
        full
        onPress={() => go("DES-04")}
      />
      <Button label="Repasar mi despensa" variant="outline" full onPress={() => go("DES-01")} />
      {aviso ? <K.Banner title={aviso} tone="RED" /> : null}
    </Screen>
  );
}

// Fila de ítem: checkbox explícito a la izquierda (toca para marcar/desmarcar)
// + ícono de basura a la derecha (toca para eliminar de la lista).
function ItemRow({ it, valor, onToggle, onDelete, disabled }) {
  const done = !!it.listo;
  return (
    <View style={styles.itemRow}>
      <Pressable
        onPress={onToggle}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled }}
        accessibilityLabel={`${it.nombre}, ${valor}`}
        accessibilityHint={done ? "Toca para desmarcar" : "Toca para marcar como comprado"}
        style={(state) => [
          styles.checkZone,
          state.pressed && styles.pressed,
          focoVisible(state),
        ]}
      >
        <View style={[styles.checkbox, done && styles.checkboxDone]}>
          {done ? <Icon name="checkmark" size={14} color={colors.white} /> : null}
        </View>
        <View style={styles.itemMain}>
          <Text style={[styles.itemName, done && styles.itemNameDone]} numberOfLines={2}>
            {it.nombre}
          </Text>
          <Text style={[styles.itemValor, done && styles.itemValorDone]}>
            {valor}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onDelete}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Eliminar ${it.nombre} de la lista`}
        hitSlop={8}
        style={(state) => [
          styles.deleteBtn,
          state.pressed && styles.pressed,
          focoVisible(state),
        ]}
      >
        <Icon name="trash-outline" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: 4, marginBottom: spacing.sm },
  rows: { gap: 0 },
  seccionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  seccionTitle: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    color: colors.text,
    flex: 1,
  },
  seccionCount: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.muted,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  checkZone: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 56,
  },
  pressed: { opacity: 0.6 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  itemMain: { flex: 1, gap: 2 },
  itemName: {
    fontSize: 15,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  itemNameDone: {
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  itemValor: {
    fontSize: 13,
    color: colors.sub,
  },
  itemValorDone: {
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  deleteBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
  filaQty: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  campoQty: { flex: 1 },
  botonQty: { flex: 1 },
});