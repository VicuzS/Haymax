import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import DistrictSelect from "../components/DistrictSelect";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import { registrarUsuario } from "../lib/api";
import { anunciar } from "../lib/a11y";

export default function ACC_03() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [distrito, setDistrito] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const crearCuenta = async () => {
    const email = correo.trim().toLowerCase();
    if (!nombre.trim() || !email || !clave) {
      setError("Completa tu nombre, correo y contraseña.");
      return;
    }
    if (clave.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (clave !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    setError("");
    try {
      await registrarUsuario({
        nombre: nombre.trim(),
        email,
        password: clave,
        distrito: distrito.trim() || undefined,
      });
      anunciar("Cuenta creada. Bienvenida a Haymax");
      go("INI-01");
    } catch (e) {
      const msg = String((e && e.message) || "");
      const sinRed = /fetch|failed|network|conectar/i.test(msg);
      setError(
        sinRed
          ? "No se pudo conectar con el servidor. Revisa que la API esté activa."
          : msg || "No se pudo crear la cuenta."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <Screen id="ACC-03" name="Crear cuenta">
      <View style={styles.wrap}>
        <View style={styles.intro}>
          <K.TextLine text="Regístrate en Haymax" bold />
          <K.TextLine text="Tu cuenta guardará tu perfil, despensa y planificación." />
        </View>

        <View style={styles.form}>
          <K.InputField
            label="Nombre completo"
            placeholder="Nombre y apellido"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />
          <K.InputField
            label="Correo electrónico"
            placeholder="tucorreo@ejemplo.com"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />
          <K.InputField
            label="Contraseña (mínimo 8 caracteres)"
            placeholder="Crea una contraseña"
            value={clave}
            onChangeText={setClave}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <K.InputField
            label="Repite la contraseña"
            placeholder="Vuelve a escribirla"
            value={confirmar}
            onChangeText={setConfirmar}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <DistrictSelect
            label="Distrito (opcional)"
            placeholder="Selecciona tu distrito"
            value={distrito}
            onChange={setDistrito}
          />
          <K.TextLine
            text="Usaremos tu distrito para recomendarte recetas y precios típicos de tu zona. Puedes cambiarlo después en tu perfil."
          />
        </View>

        {error ? <K.Note text={error} alerta /> : null}

        <Button
          label={cargando ? "Creando cuenta…" : "Crear cuenta"}
          full
          loading={cargando}
          onPress={crearCuenta}
          disabled={cargando}
        />

        <View style={styles.footer}>
          <K.LinkText
            label="¿Ya tienes cuenta? Inicia sesión"
            align="CENTER"
            onPress={() => go("ACC-02")}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 32,
    paddingHorizontal: spacing.sm,
  },
  intro: {
    marginBottom: spacing.lg,
  },
  form: {
    gap: 12,
    marginBottom: spacing.lg,
  },
  footer: {
    marginTop: spacing.md,
  },
});