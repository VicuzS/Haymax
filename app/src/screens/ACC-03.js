import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors } from "../tokens";

export default function ACC_03() {
  return (
    <Screen id="ACC-03" name="Qué hace Haymax + permisos">
      <K.SectionTitle title="Qué hace Haymax" />
      <K.TextLine text="Cocina con lo que ya tienes y reduce el desperdicio de comida." />

      <K.SectionTitle title="Permisos que necesitamos" />
      <View style={styles.rows}>
        <K.Row label="Cámara" value="Requerido" icon="📷" />
        <K.Row label="Notificaciones" value="Requerido" icon="🔔" />
        <K.Row label="Ubicación" value="Opcional" valueColor={colors.muted} icon="📍" />
      </View>

      <K.Note text="Sin la cámara aún puedes registrar insumos de forma manual." />
      <Button label="Continuar" full onPress={() => go("ACC-04")} />
      <Button label="Omitir por ahora" variant="outline" full onPress={() => go("ACC-04")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 0 } });
