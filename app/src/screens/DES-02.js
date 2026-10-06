import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import { pantryMock } from "../data/mock";

export default function DES_02({ insumo }) {
  const item = pantryMock.find((p) => p.id === insumo) || pantryMock[0];
  const [cantidad, setCantidad] = useState(String(item.cantidad));
  const [unidad, setUnidad] = useState(item.unidad);
  const [vence, setVence] = useState(item.fechaVencimiento.split("-").reverse().join("/"));

  const guardar = () => {
    const idx = pantryMock.findIndex((p) => p.id === item.id);
    if (idx >= 0) {
      const base = pantryMock[idx];
      const n = Number(cantidad);
      pantryMock.splice(idx, 1, {
        ...base,
        cantidad: !Number.isNaN(n) && n > 0 ? n : base.cantidad,
        unidad: unidad.trim() || base.unidad,
      });
    }
    go("DES-01");
  };

  const eliminar = () => {
    const i = pantryMock.findIndex((p) => p.id === item.id);
    if (i >= 0) pantryMock.splice(i, 1);
    go("DES-01");
  };

  return (
    <Screen id="DES-02" name="Detalle de insumo (editar)">
      <K.SectionTitle title={item.nombre} action="Editar" />
      <View style={styles.rows}>
        <K.InputField placeholder="Cantidad" value={cantidad} onChangeText={setCantidad} keyboardType="numeric" />
        <K.InputField placeholder="Unidad" value={unidad} onChangeText={setUnidad} />
        <K.InputField placeholder="Vence en (aaaa-mm-dd)" value={vence} onChangeText={setVence} />
      </View>
      <K.Note text="Avisaremos 2 días antes de que venza." />
      <Button label="Guardar cambios" full onPress={guardar} />
      <Button label="Eliminar de la despensa" variant="outline" full onPress={eliminar} />
      <K.TextLine text="Se pedirá confirmación antes de eliminar." />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
