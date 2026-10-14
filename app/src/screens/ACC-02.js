import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import { login } from "../lib/api";

export default function ACC_02() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const entrarCuenta = async () => {
    const email = correo.trim().toLowerCase();
    if (!email || !clave) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setCargando(true);
    setError("");
    try {
      await login(email, clave);
      go("INI-01");
    } catch (e) {
      const msg = String((e && e.message) || "");
      const sinRed = /fetch|failed|network|conectar/i.test(msg);
      setError(
        sinRed
          ? "No se pudo conectar con el servidor. Revisa que la API esté activa."
          : msg || "No se pudo iniciar sesión. Revisa tu correo y contraseña."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <Screen id="ACC-02" name="Iniciar sesión">
      <View style={styles.wrap}>
        <View style={styles.intro}>
          <K.TextLine text="Bienvenido de vuelta" bold />
          <K.TextLine text="Ingresa con tu cuenta de Haymax para acceder a tu despensa y tus planes." />
        </View>

        <View style={styles.form}>
          <K.InputField
            placeholder="Correo electrónico"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <K.InputField
            placeholder="Contraseña"
            value={clave}
            onChangeText={setClave}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {error ? <K.Note text={error} /> : null}

        <Button
          label={cargando ? "Iniciando sesión…" : "Iniciar sesión"}
          full
          onPress={entrarCuenta}
          disabled={cargando}
        />

        <View style={styles.footer}>
          <K.LinkText
            label="¿No tienes cuenta? Regístrate"
            align="CENTER"
            onPress={() => go("ACC-03")}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // 48 + 16 del Screen = 64px desde el borde superior
  // 8 + 16 del Screen = 24px de margen lateral
  wrap: {
    paddingTop: 48,
    paddingHorizontal: spacing.sm,
  },
  intro: {
    marginBottom: spacing.xl,   // 32px antes de los campos
  },
  form: {
    gap: 12,
    marginBottom: spacing.lg,   // 24px antes del botón / error
  },
  footer: {
    marginTop: spacing.md,      // 16px extra antes del link de registro
  },
});