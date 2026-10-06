import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { recetaById, ingredienteCubierto, faltantes } from "../lib/domain";
import { agregarALista } from "../data/mock";

export default function PLA_03({ receta }) {
  const r = recetaById(receta);
  const tiene = r.ingredientes.filter((i) => ingredienteCubierto(i));
  const falta = faltantes(r);

  const planificarConFaltantes = () => {
    agregarALista(falta);
    go("PLA-05");
  };

  return (
    <Screen id="PLA-03" name="Planificar: resultado con faltantes">
      <K.SectionTitle title="Tienes en despensa" />
      {tiene.length === 0 ? (
        <K.TextLine text="Ningún insumo de esta receta está en tu despensa." />
      ) : (
        <View style={styles.rows}>
          {tiene.map((i) => (
            <K.Row key={i} label={i} value="✓" />
          ))}
        </View>
      )}

      <K.SectionTitle title="Te falta" />
      {falta.length === 0 ? (
        <K.TextLine text="¡Nada! Ya puedes cocinar esta receta completa." />
      ) : (
        <View style={styles.rows}>
          {falta.map((i) => (
            <K.Row key={i} label={i} value="!" />
          ))}
        </View>
      )}

      <K.Note text="Enviaremos los faltantes a tu lista de compras." />
      <Button label="Planificar igual y agregar faltantes" full onPress={planificarConFaltantes} />
      <Button label="Solo planificar" variant="outline" full onPress={() => go("PLA-05")} />
      <K.LinkText label="Ver mi lista de compras" align="CENTER" onPress={() => go("COM-01")} />
      <K.LinkText label="Cancelar" align="CENTER" onPress={() => go("PLA-01", { receta: r.id })} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 0 } });
