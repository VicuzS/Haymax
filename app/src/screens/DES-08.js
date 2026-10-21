import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import { getUltimosAgregados } from "../lib/api";

export default function DES_08() {
  const items = getUltimosAgregados();
  return (
    <Screen id="DES-08" name="Confirmación de alta (éxito)">
      <K.CheckCircle title="Insumos agregados a tu despensa" />
      <View style={styles.rows}>
        {items.map((it) => (
          <K.Row key={it.id} label={it.nombre} value={it.cantidad} icon="leaf-outline" />
        ))}
      </View>
      <K.TextLine text="Ya puedes usarlos en el motor de recetas." />
      <Button label="Continuar y planificar" full onPress={() => go("PLA-05")} />
      <Button label="Ver mi despensa" variant="outline" full onPress={() => go("DES-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
