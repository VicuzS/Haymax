import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import useApi from "../hooks/useApi";
import { colors, radius, spacing, typography } from "../tokens";
import {
  agregarCompra,
  actualizarCompra,
  eliminarCompra,
  generarListaCompras,
  getCompras,
  setCompraListo,
} from "../lib/api";

const NOMBRE = "Lista de compras";
const SECCIONES = ["Supermercado", "Mercado de abastos"];

export default function COM_01() {
  const { data, loading, error, recargar } = useApi(getCompras);
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [unidad, setUnidad] = useState("und");
  const [seccion, setSeccion] = useState("Mercado de abastos");
  const [editandoId, setEditandoId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editCantidad, setEditCantidad] = useState("");
  const [editUnidad, setEditUnidad] = useState("und");
  const [editSeccion, setEditSeccion] = useState("Mercado de abastos");
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");

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
  const grupos = Array.from(new Set([
    ...SECCIONES,
    ...items.map((item) => item.seccion).filter(Boolean),
  ]));

  const toggle = async (id) => {
    setOcupado(true);
    setMensaje("");
    try {
      await setCompraListo(id);
      recargar({ silencioso: true });
    } catch (e) {
      setMensaje(e.message || "No se pudo actualizar el artículo.");
    } finally {
      setOcupado(false);
    }
  };

  const quitar = async (id) => {
    setOcupado(true);
    setMensaje("");
    try {
      await eliminarCompra(id);
      recargar({ silencioso: true });
    } catch (e) {
      setMensaje(e.message || "No se pudo quitar el artículo.");
    } finally {
      setOcupado(false);
    }
  };

  const editar = (item) => {
    setEditandoId(item.id);
    setEditNombre(item.nombre);
    setEditCantidad(String(item.cantidad || "1"));
    setEditUnidad(item.unidad_medida || "und");
    setEditSeccion(item.seccion || "Mercado de abastos");
    setMensaje("");
  };

  const guardarEdicion = async () => {
    if (!editNombre.trim() || !editCantidad.trim() || !editUnidad.trim()) {
      setMensaje("Completa el producto, la cantidad y la unidad.");
      return;
    }
    setOcupado(true);
    setMensaje("");
    try {
      await actualizarCompra(editandoId, {
        nombre: editNombre.trim(),
        cantidad: editCantidad.trim(),
        unidad_medida: editUnidad.trim(),
        seccion: editSeccion,
      });
      setEditandoId(null);
      recargar({ silencioso: true });
      setMensaje("Artículo actualizado.");
    } catch (e) {
      setMensaje(e.message || "No se pudo actualizar el artículo.");
    } finally {
      setOcupado(false);
    }
  };

  const agregar = async () => {
    if (!nombre.trim() || !cantidad.trim() || !unidad.trim()) {
      setMensaje("Completa el producto, la cantidad y la unidad.");
      return;
    }
    setOcupado(true);
    setMensaje("");
    try {
      await agregarCompra({ nombre: nombre.trim(), cantidad: cantidad.trim(), unidad_medida: unidad.trim(), seccion });
      setNombre("");
      setCantidad("1");
      setUnidad("und");
      recargar({ silencioso: true });
      setMensaje("Artículo agregado a la lista.");
    } catch (e) {
      setMensaje(e.message || "No se pudo agregar el artículo.");
    } finally {
      setOcupado(false);
    }
  };

  const generar = async () => {
    setOcupado(true);
    setMensaje("");
    try {
      const resultado = await generarListaCompras();
      recargar({ silencioso: true });
      setMensaje(resultado.creados
        ? `Se agregaron ${resultado.creados} artículo${resultado.creados === 1 ? "" : "s"} faltante${resultado.creados === 1 ? "" : "s"}.`
        : "No hay faltantes nuevos para agregar desde el plan de esta semana.");
    } catch (e) {
      setMensaje(e.message || "No se pudo generar la lista desde el plan.");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Screen id="COM-01" name={NOMBRE}>
      <K.Progress label="Tu lista de compras" right={`${prog.listos} de ${prog.total} artículos listos`} pct={prog.pct} />

      <Button label="Generar faltantes del plan de esta semana" variant="outline" full loading={ocupado} onPress={generar} />

      {mensaje ? (
        <K.Banner
          title={mensaje}
          tone={/no se pudo|completa|obligatorio|inválid|sesión|token|error/i.test(mensaje) ? undefined : "GREEN"}
        />
      ) : null}

      {items.length === 0 ? (
        <K.EmptyState title="Tu lista está vacía" sub="Agrega artículos o genera los faltantes de tu plan semanal." />
      ) : grupos.map((grupo) => {
        const delGrupo = items.filter((item) => item.seccion === grupo);
        if (!delGrupo.length) return null;
        return (
          <View key={grupo} style={styles.grupo}>
            <K.SectionTitle title={grupo} />
            <View style={styles.items}>
              {delGrupo.map((item) => (
                editandoId === item.id ? (
                  <View key={item.id} style={styles.inlineForm}>
                    <K.InputField placeholder="Producto" value={editNombre} onChangeText={setEditNombre} />
                    <View style={styles.cantidadRow}>
                      <View style={styles.cantidad}>
                        <K.InputField placeholder="Cantidad" value={editCantidad} onChangeText={setEditCantidad} keyboardType="decimal-pad" />
                      </View>
                      <View style={styles.unidad}>
                        <K.InputField placeholder="Unidad" value={editUnidad} onChangeText={setEditUnidad} />
                      </View>
                    </View>
                    <K.Chips items={SECCIONES} active={editSeccion} onPressItem={setEditSeccion} />
                    <View style={styles.editActions}>
                      <Button label="Guardar" full loading={ocupado} onPress={guardarEdicion} />
                      <Button label="Cancelar" variant="outline" full disabled={ocupado} onPress={() => setEditandoId(null)} />
                    </View>
                  </View>
                ) : (
                  <View key={item.id} style={styles.item}>
                    <Pressable
                      style={styles.itemMain}
                      onPress={() => toggle(item.id)}
                      disabled={ocupado}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: item.listo, disabled: ocupado }}
                      accessibilityLabel={`${item.nombre}, ${item.cantidad}. ${item.listo ? "Comprado" : "Pendiente"}`}
                    >
                      <Ionicons
                        name={item.listo ? "checkmark-circle" : "ellipse-outline"}
                        size={23}
                        color={item.listo ? colors.green : colors.muted}
                      />
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, item.listo && styles.itemDone]}>{item.nombre}</Text>
                        <Text style={styles.itemQuantity}>{item.cantidad}{item.unidad_medida ? ` · ${item.unidad_medida}` : ""}</Text>
                      </View>
                    </Pressable>
                    <Pressable onPress={() => editar(item)} disabled={ocupado} style={styles.actionButton} accessibilityRole="button" accessibilityLabel={`Editar ${item.nombre}`}>
                      <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      onPress={() => quitar(item.id)}
                      disabled={ocupado}
                      style={styles.deleteButton}
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar ${item.nombre} de la lista`}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.red} />
                    </Pressable>
                  </View>
                )
              ))}
            </View>
          </View>
        );
      })}

      <View style={styles.form}>
        <K.SectionTitle title="Agregar artículo" />
        <K.InputField placeholder="Producto" value={nombre} onChangeText={setNombre} />
        <View style={styles.cantidadRow}>
          <View style={styles.cantidad}>
            <K.InputField placeholder="Cantidad" value={cantidad} onChangeText={setCantidad} keyboardType="decimal-pad" />
          </View>
          <View style={styles.unidad}>
            <K.InputField placeholder="Unidad" value={unidad} onChangeText={setUnidad} />
          </View>
        </View>
        <K.Chips items={SECCIONES} active={seccion} onPressItem={setSeccion} />
        <Button label="Agregar a la lista" full disabled={ocupado} onPress={agregar} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: 2 },
  items: { gap: 4 },
  inlineForm: { gap: spacing.sm, borderRadius: radius.md, padding: spacing.sm, backgroundColor: colors.white },
  editActions: { flexDirection: "row", gap: spacing.sm },
  item: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemMain: { flex: 1, minHeight: 58, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.sm },
  itemInfo: { flex: 1, paddingVertical: spacing.xs },
  itemName: { color: colors.text, fontSize: typography.sizes.body, fontWeight: typography.weights.semibold },
  itemDone: { color: colors.muted, textDecorationLine: "line-through" },
  itemQuantity: { color: colors.sub, fontSize: typography.sizes.small, marginTop: 2 },
  actionButton: { minWidth: 44, minHeight: 48, alignItems: "center", justifyContent: "center" },
  deleteButton: { minWidth: 44, minHeight: 48, alignItems: "center", justifyContent: "center" },
  form: { gap: spacing.sm, marginTop: spacing.sm, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg },
  cantidadRow: { flexDirection: "row", gap: spacing.sm },
  cantidad: { flex: 1 },
  unidad: { flex: 1 },
});
