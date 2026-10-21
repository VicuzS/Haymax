import { useState } from "react";
import { Text, Pressable, StyleSheet, View } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import Icon from "../components/Icon";
import * as K from "../components/kit";
import { go, replaceTo } from "../lib/nav";
import { colors, spacing, typography } from "../tokens";
import useApi from "../hooks/useApi";
import { getSesion, cerrarSesion } from "../lib/api";
import { anunciar, focoVisible } from "../lib/a11y";
import { leerPreferencias, guardarPreferencias } from "../lib/preferencias";

const NOMBRE = "Ajustes";

export default function AJU_01() {
  const { data, loading, error, recargar } = useApi(async () => {
    const [sesion, prefs] = await Promise.all([getSesion(), leerPreferencias()]);
    return { sesion, prefs };
  });
  const [cerrando, setCerrando] = useState(false);
  const [guardandoNotif, setGuardandoNotif] = useState(false);
  const [errorNotif, setErrorNotif] = useState("");

  const sesion = data && data.sesion;
  const prefs =
    (data && data.prefs) ||
    { notificaciones: true, exclusiones: [], tiposExcluidos: [] };

  const usuario = (sesion && (sesion.nombre || sesion.usuario)) || "Mi cuenta";
  const notif = !!prefs.notificaciones;
  const exclusionesActivas =
    (prefs.exclusiones || []).length + (prefs.tiposExcluidos || []).length;

  const cerrar = async () => {
    if (cerrando) return;
    setCerrando(true);
    try {
      await cerrarSesion();
    } finally {
      replaceTo("ACC-02");
    }
  };

  const alternarNotif = async () => {
    if (guardandoNotif) return;
    setGuardandoNotif(true);
    setErrorNotif("");
    try {
      const nuevas = await guardarPreferencias({ notificaciones: !notif });
      anunciar(nuevas.notificaciones ? "Notificaciones activadas" : "Notificaciones desactivadas");
      recargar({ silencioso: true });
    } catch (e) {
      setErrorNotif((e && e.message) || "No se pudo actualizar la preferencia.");
    } finally {
      setGuardandoNotif(false);
    }
  };

  if (error) {
    return (
      <Screen id="AJU-01" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  return (
    <Screen id="AJU-01" name={NOMBRE}>
      <Text style={styles.section} accessibilityRole="header">Mi cuenta</Text>
      <SettingRow
        icon="person-outline"
        label={loading ? "Cargando perfil…" : usuario}
        value="Ver perfil"
        onPress={() => go("ACC-04")}
        hint="Abre tu perfil para editar tus datos personales, foto y distrito"
      />

      <Text style={styles.section} accessibilityRole="header">Notificaciones</Text>
      <SettingRow
        icon="notifications-outline"
        label="Recordatorios de vencimiento"
        value={notif ? "Activadas" : "Desactivadas"}
        valueColor={notif ? colors.green : colors.muted}
        onPress={alternarNotif}
        disabled={guardandoNotif}
        toggle
        toggleOn={notif}
        hint="Activa o desactiva los recordatorios de vencimiento"
      />
      {errorNotif ? <K.Note text={errorNotif} alerta /> : null}

      <Text style={styles.section} accessibilityRole="header">Preferencias</Text>
      <SettingRow
        icon="ban-outline"
        label="Exclusiones alimentarias"
        value={exclusionesActivas > 0 ? `${exclusionesActivas} activa${exclusionesActivas === 1 ? "" : "s"}` : "Ninguna"}
        valueColor={exclusionesActivas > 0 ? colors.amber : colors.muted}
        onPress={() => go("AJU-02")}
        hint="Configura ingredientes y tipos de plato que no quieres"
      />

      <Text style={styles.section} accessibilityRole="header">Hogar</Text>
      <SettingRow
        icon="people-outline"
        label="Integrantes del hogar"
        value="2"
        onPress={() => go("AJU-03")}
        hint="Ver integrantes y compartir la despensa"
      />

      <Text style={styles.section} accessibilityRole="header">Suscripción</Text>
      <SettingRow
        icon="star-outline"
        label="Plan actual"
        value="Gratis"
        onPress={() => go("AJU-04")}
        hint="Ver detalles del plan y opciones premium"
      />

      <Button
        label={cerrando ? "Cerrando sesión…" : "Cerrar sesión"}
        variant="outline"
        full
        onPress={cerrar}
        disabled={cerrando}
      />
    </Screen>
  );
}

function SettingRow({ icon, label, value, valueColor, onPress, disabled, hint, toggle, toggleOn }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label}${value ? `, ${value}` : ""}`}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled, checked: toggle ? !!toggleOn : undefined }}
      style={(state) => [styles.row, state.pressed && styles.pressed, disabled && styles.rowDisabled, focoVisible(state)]}
    >
      <View style={styles.iconBox}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value ? <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text> : null}
      </View>
      {toggle ? (
        <View style={[styles.pillToggle, toggleOn && styles.pillToggleOn]}>
          <View style={[styles.pillDot, toggleOn && styles.pillDotOn]} />
        </View>
      ) : (
        <Icon name="chevron-forward" size={18} color={colors.muted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    fontSize: typography.sizes.caption,
    letterSpacing: 1,
    fontWeight: typography.weights.semibold,
    color: colors.muted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.6 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowMain: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontWeight: typography.weights.medium, color: colors.text },
  rowValue: { fontSize: 13, color: colors.sub },
  pillToggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: colors.track, padding: 3 },
  pillToggleOn: { backgroundColor: colors.primary },
  pillDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
  pillDotOn: { alignSelf: "flex-end" },
});