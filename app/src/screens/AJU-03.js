import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";

export default function AJU_03() {
  return (
    <Screen id="AJU-03" name="Integrantes del hogar">
      <K.SectionTitle title="Integrantes del hogar" />
      <View style={styles.rows}>
        <K.Row label="Rosa Ticlla" value="Admin" icon="R" />
        <K.Row label="Diego Lopez" value="Miembro" valueColor="#9E9E9E" icon="D" />
      </View>
      <Button label="Invitar por enlace" variant="outline" full onPress={() => go("AJU-01")} />
      <K.Note text="Fase 2: la despensa se sincroniza entre los celulares del hogar." />
      <Button label="Guardar" full onPress={() => go("AJU-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 0, marginBottom: spacing.xs } });
