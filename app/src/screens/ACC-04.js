import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import useApi from "../hooks/useApi";
import { getPerfil, actualizarPerfil } from "../lib/api";

export default function ACC_04() {
  const { data: perfil, loading, error: errorCarga, recargar } = useApi(getPerfil);
  const [nombre, setNombre] = useState("");
  const [distrito, setDistrito] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    setNombre(perfil.nombre || "");
    setDistrito(perfil.distrito || "");
    setFotoUrl(perfil.foto_url || "");
  }, [perfil]);

  const guardar = async () => {
    if (!nombre.trim()) {
      setError("El nombre no puede estar vacío.");
      return;
    }
    setGuardando(true);
    setError("");
    setGuardado(false);
    try {
      await actualizarPerfil({
        nombre: nombre.trim(),
        distrito: distrito.trim() || null,
        foto_url: fotoUrl.trim() || null,
      });
      setGuardado(true);
    } catch (e) {
      setError((e && e.message) || "No se pudo guardar el perfil.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Screen id="ACC-04" name="Mi perfil">
      {loading ? <K.Loading text="Cargando tu perfil…" /> : null}
      {errorCarga ? (
        <View style={styles.rows}>
          <K.Note text="No se pudo cargar el perfil de tu cuenta." />
          <Button label="Reintentar" variant="outline" full onPress={recargar} />
        </View>
      ) : null}
      {!loading && !errorCarga && perfil ? (
        <>
          <K.TextLine text="Actualiza tus datos personales. Los cambios se guardan en tu cuenta." />
          <View style={styles.rows}>
            <K.InputField placeholder="Nombre completo" value={nombre} onChangeText={setNombre} autoCapitalize="words" />
            <K.TextLine text={`Correo: ${perfil.email || "Sin correo"}`} />
            <K.InputField placeholder="Distrito" value={distrito} onChangeText={setDistrito} autoCapitalize="words" />
            <K.InputField
              placeholder="URL de foto (opcional)"
              value={fotoUrl}
              onChangeText={setFotoUrl}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {error ? <K.Note text={error} /> : null}
          {guardado ? <K.TextLine text="Perfil actualizado correctamente." color="#287A48" bold /> : null}
          <Button label={guardando ? "Guardando…" : "Guardar cambios"} full onPress={guardar} disabled={guardando} />
          <Button label="Volver a ajustes" variant="outline" full onPress={() => go("AJU-01")} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm, marginBottom: spacing.xs } });
