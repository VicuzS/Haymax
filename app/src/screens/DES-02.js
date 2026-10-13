import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import useApi from "../hooks/useApi";
import { getDespensa, actualizarInsumo, eliminarInsumo } from "../lib/api";

const NOMBRE = "Detalle de insumo (editar)";

export default function DES_02({ insumo }) {
  const { data, loading, error, recargar } = useApi(getDespensa);
  const [cantidad, setCantidad] = useState("");
  const [unidad, setUnidad] = useState("");
  const [vence, setVence] = useState("");

  if (loading) {
    return (
      <Screen id="DES-02" name={NOMBRE}>
        <K.Loading text="Cargando insumo…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="DES-02" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const item = data.items.find((p) => p.id === insumo) || data.items[0];
  const cant0 = cantidad || String(item.cantidad);
  const uni0 = unidad || item.unidad;
  const vence0 = vence || item.fechaVencimiento.split("-").reverse().join("/");

  const guardar = async () => {
    const n = Number(cant0);
    await actualizarInsumo(item.id, {
      cantidad: !Number.isNaN(n) && n > 0 ? n : item.cantidad,
      unidad: uni0.trim() || item.unidad,
      fechaVencimiento: vence0,
    });
    go("DES-01");
  };

  const eliminar = async () => {
    await eliminarInsumo(item.id);
    go("DES-01");
  };

  return (
    <Screen id="DES-02" name={NOMBRE}>
      <K.SectionTitle title={item.nombre} action="Editar" />
      <View style={styles.rows}>
        <K.InputField placeholder="Cantidad" value={cant0} onChangeText={setCantidad} keyboardType="numeric" />
        <K.InputField placeholder="Unidad" value={uni0} onChangeText={setUnidad} />
        <K.InputField placeholder="Vence en (aaaa-mm-dd)" value={vence0} onChangeText={setVence} />
      </View>
      <K.Note text="Avisaremos 2 días antes de que venza." />
      <Button label="Guardar cambios" full onPress={guardar} />
      <Button label="Eliminar de la despensa" variant="outline" full onPress={eliminar} />
      <K.TextLine text="Se pedirá confirmación antes de eliminar." />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
