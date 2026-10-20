import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, spacing, typography } from "../tokens";
import { confirmarEscaneo, getEscaneoPendiente } from "../lib/api";

export default function DES_05() {
  const [escaneo] = useState(() => getEscaneoPendiente());
  const [items, setItems] = useState(() => escaneo?.items || []);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (id, campo, valor) => {
    setItems((actuales) => actuales.map((item) => item.id === id ? { ...item, [campo]: valor } : item));
  };

  const quitar = (id) => setItems((actuales) => actuales.filter((item) => item.id !== id));

  const confirmar = async () => {
    const preparados = items.map((item) => ({
      ...item,
      cantidad: Number(String(item.cantidad).replace(",", ".")),
    }));
    if (preparados.some((item) => !item.nombre.trim() || !Number.isFinite(item.cantidad) || item.cantidad <= 0 || !item.unidad.trim())) {
      Alert.alert("Revisa los datos", "Cada producto necesita nombre, cantidad mayor que cero y unidad de medida.");
      return;
    }
    setGuardando(true);
    try {
      await confirmarEscaneo(preparados);
      go("DES-08");
    } catch (error) {
      Alert.alert("No se pudo guardar", error.message || "Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Screen id="DES-05" name="Revisar productos reconocidos">
      {!escaneo ? (
        <>
          <K.EmptyState title="No hay un análisis pendiente" sub="Toma una foto o selecciona una imagen para comenzar." />
          <Button label="Volver a escanear" full onPress={() => go("DES-04")} />
        </>
      ) : (
        <>
          {escaneo.uri ? <Image source={{ uri: escaneo.uri }} style={styles.preview} resizeMode="cover" /> : null}
          <K.SectionTitle title={`${escaneo.tipo === "boleta" ? "Boleta" : "Lista de compras"} · ${items.length} productos`} />
          <K.TextLine text="Revisa o corrige los campos reconocidos. Solo se guardará lo que confirmes." />

          {items.length === 0 ? (
            <K.EmptyState title="No se detectaron productos" sub="Prueba otra foto o registra los productos manualmente." />
          ) : items.map((item, index) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Producto {index + 1}</Text>
                <Pressable onPress={() => quitar(item.id)} accessibilityRole="button" accessibilityLabel={`Quitar ${item.nombre || `producto ${index + 1}`}`}>
                  <Text style={styles.remove}>Quitar</Text>
                </Pressable>
              </View>
              {item.requiere_revision ? <K.Note text="No se reconoció algún dato con claridad; revísalo antes de guardar." /> : null}
              <K.InputField
                placeholder="Nombre del producto"
                value={item.nombre}
                onChangeText={(value) => cambiar(item.id, "nombre", value)}
              />
              <View style={styles.quantityRow}>
                <View style={styles.quantity}>
                  <K.InputField
                    placeholder="Cantidad"
                    value={String(item.cantidad ?? "")}
                    onChangeText={(value) => cambiar(item.id, "cantidad", value)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.unit}>
                  <K.InputField
                    placeholder="Unidad"
                    value={item.unidad}
                    onChangeText={(value) => cambiar(item.id, "unidad", value)}
                  />
                </View>
              </View>
              <K.InputField
                placeholder="Categoría"
                value={item.categoria}
                onChangeText={(value) => cambiar(item.id, "categoria", value)}
              />
              {item.precio ? <K.Row label="Precio leído (referencial)" value={item.precio} /> : null}
            </View>
          ))}

          <Button label="Confirmar y agregar a mi despensa" full loading={guardando} disabled={!items.length} onPress={confirmar} />
          <Button label="Repetir escaneo" variant="outline" full disabled={guardando} onPress={() => go("DES-04")} />
          <Button label="Registrar manualmente" variant="outline" full disabled={guardando} onPress={() => go("DES-06")} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { width: "100%", height: 180, borderRadius: 12, backgroundColor: colors.greyBg },
  itemCard: { gap: spacing.sm, borderRadius: 14, padding: spacing.md, backgroundColor: colors.white },
  itemHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemTitle: { color: colors.text, fontSize: typography.sizes.label, fontWeight: typography.weights.semibold },
  remove: { color: colors.red, fontSize: typography.sizes.small, fontWeight: typography.weights.semibold, padding: 8 },
  quantityRow: { flexDirection: "row", gap: spacing.sm },
  quantity: { flex: 1 },
  unit: { flex: 1 },
});
