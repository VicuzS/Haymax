import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";

export default function INI_02() {
  return (
    <Screen id="INI-02" name="Inicio: estado vacío (primera vez)">
      <K.EmptyState
        title="Aún no tienes insumos ni plan registrado"
        sub="Tu despensa empieza vacía: registra lo que ya tienes en casa."
      />
      <K.SectionTitle title="Empieza en 2 pasos" />
      <View style={styles.rows}>
        <K.Row label="1. Registra tu despensa" icon="1" />
        <K.Row label="2. Arma tu plan semanal" icon="2" />
      </View>
      <Button label="Agregar insumos" full onPress={() => go("DES-03")} />
      <Button label="Armar mi plan" variant="outline" full onPress={() => go("PLA-01")} />
      <K.TextLine text="Puedes escanear una boleta, una lista o escribir a mano." />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 0 } });
