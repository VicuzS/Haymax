import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import { guardarSesion } from "../lib/sesion";

export default function ACC_02() {
  const [correo, setCorreo] = useState("correo@unmsm.edu.pe");
  const [clave, setClave] = useState("••••••••");

  const entrar = (modo) => async () => {
    await guardarSesion({ modo });
    go("INI-01");
  };

  return (
    <Screen id="ACC-02" name="Entrar">
      <K.TextLine text="Bienvenido de vuelta" bold />
      <View style={styles.rows}>
        <K.InputField placeholder="correo@unmsm.edu.pe" value={correo} onChangeText={setCorreo} />
        <K.InputField placeholder="••••••••" value={clave} onChangeText={setClave} />
      </View>
      <K.LinkText label="¿No tienes cuenta? Regístrate" onPress={() => go("ACC-03")} />

      <Button label="Continuar" full onPress={entrar("cuenta")} />
      <K.LinkText
        label="Entrar sin cuenta · se guarda en este dispositivo"
        align="CENTER"
        onPress={entrar("invitado")}
      />

      <K.TextLine text="o continúa con" />
      <Button label="Google" variant="outline" full onPress={entrar("cuenta")} />
      <Button label="Apple" variant="outline" full onPress={entrar("cuenta")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm, marginBottom: spacing.xs } });
