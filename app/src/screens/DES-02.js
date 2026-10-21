import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, spacing, typography } from "../tokens";
import useApi from "../hooks/useApi";
import { getDespensa, actualizarInsumo, eliminarInsumo } from "../lib/api";
import { anunciar } from "../lib/a11y";

const NOMBRE = "Detalle de insumo";

function fechaBonita(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : "";
}

function parseFecha(texto) {
  const t = String(texto || "").trim();
  if (!t) return "";
  const m1 = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  return null; // formato inválido
}

export default function DES_02({ insumo }) {
  const { data, loading, error, recargar } = useApi(getDespensa);
  const [cantidad, setCantidad] = useState("");
  const [unidad, setUnidad] = useState("");
  const [vence, setVence] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  if (loading) {
    return (
      <Screen id="DES-02" name={NOMBRE}>
        <K.Loading text="Cargando insumo…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="DES-02" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }
  // Los IDs de PostgreSQL llegan como número, mientras que los parámetros
  // de Expo Router llegan como texto; se comparan normalizados para abrir el
  // insumo que realmente seleccionó el usuario.
  const item = data.items.find((p) => String(p.id) === String(insumo)) || data.items[0];
  if (!item) {
    return (
      <Screen id="DES-02" name={NOMBRE}>
        <K.EmptyState
          title="Insumo no encontrado"
          sub="Vuelve a la despensa y elige otro."
        />
        <Button label="Volver a la despensa" full onPress={() => go("DES-01")} />
      </Screen>
    );
  }

  const cant0 = cantidad || String(item.cantidad ?? "");
  const uni0 = unidad || item.unidad || "";
  const vence0 = vence || fechaBonita(item.fechaVencimiento);
  const guardar = async () => {
    if (guardando) return;
    setErrorForm("");

    const n = Number(cant0);
    if (!Number.isFinite(n) || n < 0) {
      setErrorForm("La cantidad debe ser un número mayor o igual a 0.");
      return;
    }

    const fechaIso = parseFecha(vence0);
    if (fechaIso === null) {
      setErrorForm("La fecha debe tener el formato DD/MM/AAAA o AAAA-MM-DD.");
      return;
    }

    setGuardando(true);
    try {
      await actualizarInsumo(item.id, {
        cantidad: n,
        unidad: (uni0 || "").trim() || item.unidad,
        fechaVencimiento: fechaIso || null,
      });
      anunciar(`${item.nombre} actualizado`);
      go("DES-01");
    } catch (e) {
      setErrorForm((e && e.message) || "No se pudo guardar el insumo.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (eliminando) return;
    setEliminando(true);
    try {
      await eliminarInsumo(item.id);
      anunciar(`${item.nombre} eliminado de la despensa`);
      go("DES-01");
    } catch (e) {
      setErrorForm((e && e.message) || "No se pudo eliminar el insumo.");
      setEliminando(false);
      setConfirmando(false);
    }
  };

  return (
    <Screen id="DES-02" name={NOMBRE}>
      <View style={styles.resumen}>
        <Text style={styles.resumenNombre}>{item.nombre}</Text>
        <Text style={styles.resumenDetalle}>
          Actualmente: {cant0} {uni0}
          {item.fechaVencimiento
            ? ` · vence ${fechaBonita(item.fechaVencimiento)}`
            : ""}
        </Text>
      </View>

      <K.SectionTitle title="Editar datos" />
      <View style={styles.rows}>
        <K.InputField
          label="Cantidad"
          placeholder="Ej. 2"
          value={cant0}
          onChangeText={setCantidad}
          keyboardType="decimal-pad"
        />
        <K.InputField
          label="Unidad"
          placeholder="Ej. kg, und, atado"
          value={uni0}
          onChangeText={setUnidad}
          autoCapitalize="none"
        />
        <K.InputField
          label="Fecha de vencimiento"
          placeholder="DD/MM/AAAA"
          value={vence0}
          onChangeText={setVence}
        />
      </View>

      {errorForm ? <K.Note text={errorForm} alerta /> : null}
      <K.Note text="Te avisaremos 2 días antes de que venza." />

      <Button
        label={guardando ? "Guardando…" : "Guardar cambios"}
        full
        loading={guardando}
        onPress={guardar}
      />

      {!confirmando ? (
        <Button
          label="Eliminar de la despensa"
          variant="danger"
          full
          onPress={() => setConfirmando(true)}
        />
      ) : (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>¿Eliminar {item.nombre}?</Text>
          <Text style={styles.confirmText}>
            Esta acción no se puede deshacer.
          </Text>
          <View style={styles.confirmActions}>
            <View style={styles.confirmBtn}>
              <Button
                label="Cancelar"
                variant="outline"
                full
                onPress={() => setConfirmando(false)}
                disabled={eliminando}
              />
            </View>
            <View style={styles.confirmBtn}>
              <Button
                label={eliminando ? "Eliminando…" : "Sí, eliminar"}
                variant="danger"
                full
                onPress={eliminar}
                loading={eliminando}
              />
            </View>
          </View>
        </View>
      )}

      <K.LinkText
        label="Cancelar y volver a la despensa"
        align="CENTER"
        onPress={() => go("DES-01")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  rows: { gap: spacing.sm },
  resumen: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 4,
  },
  resumenNombre: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  resumenDetalle: {
    fontSize: typography.sizes.body,
    color: colors.sub,
  },
  confirmBox: {
    backgroundColor: colors.redBg,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  confirmTitle: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.red,
  },
  confirmText: {
    fontSize: typography.sizes.body,
    color: colors.text,
  },
  confirmActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  confirmBtn: { flex: 1 },
});