import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import { manualAddsMock } from "../data/mock";

export default function DES_06() {
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [unidad, setUnidad] = useState("unid");
  const [precio, setPrecio] = useState("");

  const listo = producto.trim().length > 0 && cantidad.trim().length > 0;

  const continuar = () => {
    manualAddsMock.push({
      id: "A" + (manualAddsMock.length + 1),
      nombre: producto.trim(),
      cantidad: `${cantidad.trim()} ${unidad.trim() || "unid"}`,
    });
    go("DES-07");
  };

  return (
    <Screen id="DES-06" name="Registro manual (paso 1 de 2)">
      <K.SectionTitle title="Paso 1 de 2 · Producto y cantidad" />
      <View style={styles.rows}>
        <K.InputField placeholder="Busca el producto en el catálogo…" value={producto} onChangeText={setProducto} />
        <K.InputField placeholder="Cantidad" value={cantidad} onChangeText={setCantidad} keyboardType="numeric" />
        <K.InputField placeholder="Unidad" value={unidad} onChangeText={setUnidad} />
        <K.InputField placeholder="Precio estimado (opcional)" value={precio} onChangeText={setPrecio} keyboardType="numeric" />
      </View>
      <Button label="Continuar" full onPress={continuar} disabled={!listo} />
      <K.LinkText label="Volver a las opciones de alta" onPress={() => go("DES-03")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
