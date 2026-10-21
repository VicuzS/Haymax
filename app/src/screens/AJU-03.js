import { View, Text, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import Icon from "../components/Icon";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, spacing, typography } from "../tokens";
import useApi from "../hooks/useApi";
import { getSesion } from "../lib/api";

const NOMBRE = "Integrantes del hogar";

export default function AJU_03() {
  const { data: sesion, loading, error, recargar } = useApi(getSesion);
  const nombre = (sesion && (sesion.nombre || sesion.usuario)) || "Mi cuenta";
  const inicial = nombre.charAt(0).toUpperCase();
  const email = (sesion && sesion.email) || "";

  if (loading) {
    return (
      <Screen id="AJU-03" name={NOMBRE}>
        <K.Loading text="Cargando integrantes…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="AJU-03" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  return (
    <Screen id="AJU-03" name={NOMBRE}>
      <K.SectionTitle title="Integrantes del hogar" />
      <View style={styles.memberCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{inicial}</Text>
        </View>
        <View style={styles.memberMain}>
          <Text style={styles.memberName}>{nombre}</Text>
          {email ? <Text style={styles.memberEmail}>{email}</Text> : null}
        </View>
        <View style={styles.adminBadge}>
          <Icon name="shield-checkmark-outline" size={12} color={colors.primary} />
          <Text style={styles.adminText}>Admin</Text>
        </View>
      </View>

      <K.Note text="Muy pronto: invita a más integrantes y comparte la despensa del hogar entre varios celulares." />
      <Button
        label="Invitar por enlace (próximamente)"
        variant="outline"
        full
        disabled
        onPress={() => {}}
      />
      <Button label="Volver a ajustes" full onPress={() => go("AJU-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: typography.weights.bold,
  },
  memberMain: { flex: 1, gap: 2 },
  memberName: {
    fontSize: 15,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  memberEmail: { fontSize: 13, color: colors.sub },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  adminText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
});