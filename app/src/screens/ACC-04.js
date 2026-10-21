import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Modal, Platform } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import Screen from "../components/Screen";
import Button from "../components/Button";
import Icon from "../components/Icon";
import DistrictSelect from "../components/DistrictSelect";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, spacing, typography, radius } from "../tokens";
import useApi from "../hooks/useApi";
import { getPerfil, actualizarPerfil } from "../lib/api";
import { anunciar, focoVisible } from "../lib/a11y";
import { leerFotoLocal, guardarFotoLocal } from "../lib/fotoPerfil";

const NOMBRE = "Mi perfil";

function inicialesDe(nombre) {
  const partes = String(nombre || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "U";
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

function aDataUri(asset) {
  if (!asset) return null;
  if (asset.base64) return `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
  return asset.uri || null;
}

export default function ACC_04() {
  const { data: perfil, loading, error: errorCarga, recargar } = useApi(getPerfil);
  return (
    <Screen id="ACC-04" name={NOMBRE}>
      {loading ? <K.Loading text="Cargando tu perfil…" /> : null}
      {errorCarga ? (
        <View style={styles.rows}>
          <K.Note text="No se pudo cargar el perfil de tu cuenta." alerta />
          <Button label="Reintentar" variant="outline" full onPress={recargar} />
        </View>
      ) : null}
      {!loading && !errorCarga && perfil ? (
        <PerfilForm key={perfil.id ?? perfil.email} perfil={perfil} />
      ) : null}
    </Screen>
  );
}

function PerfilForm({ perfil }) {
  const [nombre, setNombre] = useState(perfil.nombre || "");
  const [distrito, setDistrito] = useState(perfil.distrito || "");
  const [fotoLocal, setFotoLocal] = useState(null);
  const [fotoEliminada, setFotoEliminada] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    leerFotoLocal().then((f) => { if (f) setFotoLocal(f); }).catch(() => {});
  }, []);

  const fotoUri = fotoLocal || (fotoEliminada ? null : perfil.foto_url) || null;

  const guardar = async () => {
    if (guardando) return;
    if (!nombre.trim()) {
      setError("El nombre no puede estar vacío.");
      return;
    }
    setGuardando(true);
    setError("");
    setGuardado(false);
    try {
      const payload = {
        nombre: nombre.trim(),
        distrito: distrito.trim() || null,
      };
      if (fotoEliminada && perfil.foto_url) payload.foto_url = null;
      await actualizarPerfil(payload);
      setGuardado(true);
      anunciar("Perfil actualizado");
    } catch (e) {
      setError((e && e.message) || "No se pudo guardar el perfil.");
    } finally {
      setGuardando(false);
    }
  };

  const openPhotoMenu = () => { setError(""); setPhotoMenuOpen(true); };
  const closePhotoMenu = () => setPhotoMenuOpen(false);

  const pickImage = async (source) => {
    closePhotoMenu();
    setError("");
    try {
      if (source === "camera" && Platform.OS !== "web") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { setError("Permiso de cámara denegado."); return; }
      }
      const opts = { allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true };
      const result = source === "camera" && Platform.OS !== "web"
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync({ ...opts, mediaTypes: ["images"] });
      if (result.canceled || !result.assets?.[0]) return;
      const dataUri = aDataUri(result.assets[0]);
      if (!dataUri) { setError("No se pudo procesar la imagen."); return; }
      await guardarFotoLocal(dataUri);
      setFotoLocal(dataUri);
      setFotoEliminada(false);
      anunciar("Foto actualizada");
    } catch (e) {
      setError((e && e.message) || "No se pudo cargar la imagen.");
    }
  };

  const removePhoto = async () => {
    closePhotoMenu();
    await guardarFotoLocal(null);
    setFotoLocal(null);
    setFotoEliminada(!!perfil.foto_url);
    anunciar("Foto eliminada");
  };

  const iniciales = inicialesDe(nombre || perfil.nombre);

  return (
    <>
      <View style={styles.avatarBox}>
        <Pressable
          onPress={openPhotoMenu}
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
          accessibilityHint="Abre opciones para tomar foto, elegir de galería o quitar la foto"
          style={(state) => [styles.avatarPressable, state.pressed && { opacity: 0.85 }, focoVisible(state)]}
        >
          <View style={styles.avatar}>
            {fotoUri ? (
              <Image source={{ uri: fotoUri }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Text style={styles.avatarText}>{iniciales}</Text>
            )}
          </View>
          <View style={styles.cameraBadge}>
            <Icon name="camera" size={12} color={colors.white} />
          </View>
        </Pressable>
        <Text style={styles.avatarHint}>{perfil.email}</Text>
        <Text style={styles.avatarSubHint}>Toca la foto para cambiarla</Text>
      </View>

      <K.SectionTitle title="Datos personales" />
      <View style={styles.rows}>
        <K.InputField
          label="Nombre completo"
          placeholder="Ej. Rosa Ticlla"
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />
        <View>
          <Text style={styles.fieldLabel}>Correo electrónico</Text>
          <View style={styles.readonlyBox}>
            <Icon name="mail-outline" size={16} color={colors.muted} />
            <Text style={styles.readonlyText}>{perfil.email || "Sin correo"}</Text>
          </View>
        </View>
      </View>

      <DistrictSelect
        label="Distrito"
        placeholder="Seleccionar"
        value={distrito}
        onChange={setDistrito}
      />

      {error ? <K.Note text={error} alerta /> : null}
      {guardado ? <K.Note text="Perfil actualizado correctamente." /> : null}

      <Button label={guardando ? "Guardando…" : "Guardar cambios"} full loading={guardando} onPress={guardar} />
      <Button label="Volver a ajustes" variant="outline" full onPress={() => go("AJU-01")} />

      <Modal visible={photoMenuOpen} transparent animationType="fade" onRequestClose={closePhotoMenu}>
        <Pressable style={styles.backdrop} onPress={closePhotoMenu}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Foto de perfil</Text>
            {Platform.OS !== "web" ? (
              <Pressable
                onPress={() => pickImage("camera")}
                style={(state) => [styles.sheetItem, state.pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityLabel="Tomar foto con la cámara"
              >
                <Icon name="camera-outline" size={22} color={colors.primary} />
                <Text style={styles.sheetItemText}>Tomar foto</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => pickImage("gallery")}
              style={(state) => [styles.sheetItem, state.pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel="Elegir foto de la galería"
            >
              <Icon name="images-outline" size={22} color={colors.primary} />
              <Text style={styles.sheetItemText}>Elegir de galería</Text>
            </Pressable>
            {fotoUri ? (
              <Pressable
                onPress={removePhoto}
                style={(state) => [styles.sheetItem, state.pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityLabel="Quitar foto"
              >
                <Icon name="trash-outline" size={22} color={colors.red} />
                <Text style={[styles.sheetItemText, { color: colors.red }]}>Quitar foto</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={closePhotoMenu}
              style={(state) => [styles.sheetCancel, state.pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
            >
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  rows: { gap: spacing.sm },
  fieldLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: 6,
  },
  readonlyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: 46,
  },
  readonlyText: { fontSize: typography.sizes.body, color: colors.sub },
  avatarBox: { alignItems: "center", paddingVertical: spacing.md, gap: 4 },
  avatarPressable: { position: "relative" },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarText: { fontSize: 34, fontWeight: typography.weights.bold, color: colors.white },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarHint: { fontSize: typography.sizes.body, color: colors.sub, marginTop: 6 },
  avatarSubHint: { fontSize: typography.sizes.small, color: colors.muted },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: 4,
  },
  sheetTitle: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    minHeight: 52,
  },
  sheetItemText: { fontSize: typography.sizes.label, color: colors.text },
  sheetCancel: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  sheetCancelText: {
    fontSize: typography.sizes.label,
    color: colors.muted,
    fontWeight: typography.weights.semibold,
  },
});