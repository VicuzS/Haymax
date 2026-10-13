import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import { guardarSesion, login } from "../lib/api";

export default function ACC_02() {
  const [correo, setCorreo] = useState("rosa@haymax.pe");
  const [clave, setClave] = useState("haymax123");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const entrarCuenta = async () => {
    setCargando(true);
    setError("");
    try {
      await login(correo.trim(), clave);
      go("INI-01");
    } catch (e) {
      const msg = String((e && e.message) || "");
      const sinRed = msg.indexOf("fetch") >= 0 || msg.indexOf("Failed") >= 0 || msg.indexOf("Network") >= 0;
      setError(
        sinRed
          ? "No se pudo conectar con el servidor. Revisa que la API esté activa."
          : msg || "No se pudo entrar. Revisa tu correo y contraseña."
      );
    } finally {
      setCargando(false);
    }
  };

  const entrarInvitado = async () => {
    await guardarSesion({ modo: "invitado" });
    go("INI-01");
  };

  return (
    <Screen id="ACC-02" name="Entrar">
      <K.TextLine text="Bienvenido de vuelta" bold />
      <View style={styles.rows}>
        <K.InputField placeholder="correo@unmsm.edu.pe" value={correo} onChangeText={setCorreo} />
        <K.InputField placeholder="••••••••" value={clave} onChangeText={setClave} />
      </View>
      {error ? <K.Note text={error} /> : null}
      <K.TextLine text="Cuenta de prueba: rosa@haymax.pe / haymax123" />
      <K.LinkText label="¿No tienes cuenta? Regístrate" onPress={() => go("ACC-03")} />

      <Button label={cargando ? "Entrando…" : "Continuar"} full onPress={entrarCuenta} disabled={cargando} />
      <K.LinkText
        label="Entrar sin cuenta · se guarda en este dispositivo"
        align="CENTER"
        onPress={entrarInvitado}
      />

      <K.TextLine text="o continúa con" />
      <Button label="Google" variant="outline" full onPress={entrarInvitado} />
      <Button label="Apple" variant="outline" full onPress={entrarInvitado} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm, marginBottom: spacing.xs } });
