import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import { manualAddsMock, addLastAdded } from "../data/mock";

export default function DES_07() {
  const items = [...manualAddsMock];

  const confirmar = () => {
    addLastAdded(items);
    manualAddsMock.splice(0, manualAddsMock.length);
    go("DES-08");
  };

  return (
    <Screen id="DES-07" name="Confirmación antes de agregar">
      <K.SectionTitle title={`Vas a agregar ${items.length} insumo${items.length === 1 ? "" : "s"}`} />

      {items.length === 0 ? (
        <K.EmptyState title="No hay ítems pendientes" sub="Registra un producto para continuar." />
      ) : (
        <View style={styles.rows}>
          {items.map((it) => (
            <K.Row key={it.id} label={it.nombre} value={it.cantidad} icon="→" />
          ))}
        </View>
      )}

      <K.Note text="Las cantidades se convierten a la unidad interna automáticamente." />
      <Button label="Agregar otro ítem" variant="outline" full onPress={() => go("DES-06")} />
      <Button label="Confirmar" full onPress={confirmar} disabled={items.length === 0} />
      <Button label="Volver" variant="outline" full onPress={() => go("DES-06")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
