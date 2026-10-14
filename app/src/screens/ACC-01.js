import { Pressable, StyleSheet, View } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";

export default function ACC_01() {
  return (
    <Screen id="ACC-01" name="Bienvenida">
      <Pressable style={styles.center} onPress={() => go("ACC-02")} accessible accessibilityLabel="Iniciar sesión">
        <K.Logo tagline="Cocina con lo que ya tienes" />
      </Pressable>
      <View style={styles.actions}>
        <Button label="Iniciar sesión" full onPress={() => go("ACC-02")} />
        <Button label="Crear cuenta" variant="outline" full onPress={() => go("ACC-03")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", marginTop: 64, marginBottom: 24 },
  actions: { gap: 12 },
});
