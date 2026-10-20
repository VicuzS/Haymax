import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useFocusEffect } from "expo-router";
import Screen from "../components/Screen";
import Button from "../components/Button";
import Icon from "../components/Icon";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, radius, spacing, typography, shadows } from "../tokens";
import useApi from "../hooks/useApi";
import { getPlanSemanaDe, eliminarPlan, generarListaCompras, planificarPlato, getMotor } from "../lib/api";
import { ingredienteAlcanza, soles } from "../lib/domain";
import { resolverImagen } from "../lib/imagenes";
import {
  DIAS_CORTOS,
  hoyIso,
  lunesDeIso,
  sumarDiasIso,
  deIso,
  diaBonito,
  semanaNumero,
} from "../lib/fechas";

const NOMBRE = "Plan de la semana";
const SECCIONES = [
  { comida: "almuerzo", label: "Almuerzo", icon: "sunny-outline" },
  { comida: "cena", label: "Cena", icon: "moon-outline" },
  { comida: "desayuno", label: "Desayuno o lonchera", icon: "cafe-outline" },
];
const PLATOS_META = 21; // 7 días x 3 comidas
const DIAS_SEMANA = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const MESES_ABREV = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function PLA_09({ fecha }) {
  const hoy = hoyIso();
  const [offsetSemana, setOffsetSemana] = useState(0);
  const ancla = fecha || hoy;
  const lunesBase = lunesDeIso(ancla);
  const [sel, setSel] = useState(ancla);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [refresco, setRefresco] = useState(0);
  const { data: motor, loading: motorCargando } = useApi(getMotor);
  const recargar = useCallback(() => setRefresco((r) => r + 1), [setRefresco]);
  const lunes = sumarDiasIso(lunesBase, offsetSemana * 7);

  // Al volver a esta pantalla (desde el detalle, compras, etc.) refresca el
  // plan por si cambió fuera de aquí.
  useFocusEffect(
    useCallback(() => {
      setRefresco((r) => r + 1);
    }, [setRefresco])
  );

  // Recarga del plan cada vez que cambia la semana visible (o al volver al
  // foco), con el mismo patrón de fetch propio que usa el calendario (PLA-05).
  useEffect(() => {
    let vivo = true;
    Promise.resolve()
      .then(() => {
        if (!vivo) return undefined;
        setCargando(true);
        setError(null);
        return getPlanSemanaDe(lunes);
      })
      .then((d) => {
        if (!vivo) return;
        setDatos(d);
        setCargando(false);
      })
      .catch((e) => {
        if (!vivo) return;
        setError((e && e.message) || "No se pudo cargar el plan de la semana.");
        setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [lunes, refresco]);

  const finSemana = sumarDiasIso(lunes, 6);
  const dias = Array.from({ length: 7 }, (_, i) => {
    const iso = sumarDiasIso(lunes, i);
    return { iso, num: deIso(iso).getDate(), corto: DIAS_CORTOS[i], esHoy: iso === hoy };
  });

  if (cargando && !datos) {
    return (
      <Screen id="PLA-09" name={NOMBRE}>
        <K.Loading text="Cargando tu plan…" />
      </Screen>
    );
  }
  if (error && !datos) {
    return (
      <Screen id="PLA-09" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }
  if (!datos) return null;

  const diaSel = dias.some((d) => d.iso === sel) ? sel : lunes;
  const planesDia = datos.plan.filter((p) => p.fecha === diaSel);
  const planesSemana = datos.plan.filter((p) => p.fecha >= lunes && p.fecha <= finSemana);

  // Progreso de insumos: % de insumos cubiertos por los platos de la semana.
  let totalInsumos = 0;
  let insumosListos = 0;
  planesSemana.forEach((f) => {
    if (!f.receta) return;
    const detalle =
      f.receta.ingredientes_detalle && f.receta.ingredientes_detalle.length
        ? f.receta.ingredientes_detalle
        : (f.receta.ingredientes || []).map((t) => ({ nombre: t }));
    if (!detalle.length) return;
    totalInsumos += detalle.length;
    const v = ingredienteAlcanza(f.receta, datos.pantry, f.porciones);
    insumosListos += Math.max(0, detalle.length - v.faltantes.length);
  });
  const pct = totalInsumos ? insumosListos / totalInsumos : 0;
  const bonito = diaBonito(DIAS_SEMANA[deIso(diaSel).getDay()]);

  const quitar = async (id) => {
    if (ocupado) return;
    setOcupado(true);
    try {
      await eliminarPlan(id);
      setAviso("");
      recargar();
    } catch (e) {
      setAviso((e && e.message) || "No se pudo quitar el plato.");
    } finally {
      setOcupado(false);
    }
  };

  const generar = async () => {
    if (ocupado) return;
    setOcupado(true);
    try {
      await generarListaCompras(diaSel);
      go("COM-01");
    } catch (e) {
      setAviso((e && e.message) || "No se pudo generar la lista.");
      setOcupado(false);
    }
  };

  const moverSemana = (d) => {
    setOffsetSemana((o) => o + d);
    setSel(sumarDiasIso(lunes, d * 7));
  };

  // "Sugerir auto": la receta con mejor cobertura que no esté en el día se
  // agrega al primer hueco del día seleccionado.
  const sugerir = async () => {
    if (ocupado || !motor) return;
    setOcupado(true);
    try {
      const hueco = SECCIONES.find((s) => !planesDia.some((p) => p.comida === s.comida));
      if (!hueco) {
        setAviso("El día ya está completo. Usa «Cambiar plato» para reemplazar.");
        return;
      }
      const yaEnDia = new Set(planesDia.map((p) => p.receta_id));
      const mejor = (motor.recetas || []).find((r) => !yaEnDia.has(r.id));
      if (!mejor) {
        setAviso("No hay recetas nuevas para sugerir hoy.");
        return;
      }
      await planificarPlato({ recetaId: mejor.id, fecha: diaSel, comida: hueco.comida, porciones: mejor.porciones });
      setAviso("");
      recargar();
    } catch (e) {
      setAviso((e && e.message) || "No se pudo planificar la sugerencia.");
    } finally {
      setOcupado(false);
    }
  };

  // Receta de mejor cobertura para sugerir en los estados vacíos.
  const sugerenciaVacia =
    motor && (motor.recetas || []).length
      ? `Sugerencia: ${motor.recetas[0].nombre} está en tu alacena`
      : "Sugerencia: revisa la receta que mejor cubre tu alacena";

  return (
    <Screen id="PLA-09" name={NOMBRE}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plan de la semana</Text>
        <View style={styles.headerSub}>
          <Icon name="calendar-outline" size={13} color={colors.primary} />
          <Text style={styles.headerSubText}>{etiquetaSemana(lunes, finSemana)}</Text>
        </View>
      </View>

      <K.Progress
        label={`${Math.round(pct * 100)}% de insumos listos en tu alacena`}
        right={`${planesSemana.length} / ${PLATOS_META} platos`}
        pct={pct}
      />

      <View style={styles.selRow}>
        <Text style={styles.selLabel}>SELECCIONA EL DÍA</Text>
        <Text style={styles.selSemana}>{`Semana ${semanaNumero(lunes)}`}</Text>
      </View>
      <View style={styles.diasFila}>
        <Flecha icon="chevron-back" onPress={() => moverSemana(-1)} disabled={ocupado} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.diasScroll}>
          {dias.map((d) => {
            const activo = d.iso === diaSel;
            return (
              <Pressable
                key={d.iso}
                onPress={() => setSel(d.iso)}
                style={[styles.diaChip, d.esHoy && styles.diaChipHoy, activo && !d.esHoy && styles.diaChipSel]}
              >
                {d.esHoy && <Text style={styles.diaChipHoyTag}>HOY</Text>}
                <Text style={[styles.diaChipDow, (activo || d.esHoy) && styles.diaChipTextoOn]}>{d.corto}</Text>
                <Text style={[styles.diaChipNum, (activo || d.esHoy) && styles.diaChipTextoOn]}>{d.num}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Flecha icon="chevron-forward" onPress={() => moverSemana(1)} disabled={ocupado} />
      </View>

      <View style={styles.menuRow}>
        <Text style={styles.menuTitulo}>
          {`Menú del ${bonito.charAt(0).toUpperCase() + bonito.slice(1)}`}
        </Text>
        <K.Chips items={[`${planesDia.length} platos`]} ok />
        <Pressable onPress={sugerir} hitSlop={6} style={({ pressed }) => pressed && styles.pressOn}>
          <Text style={styles.menuSugerir}>{motorCargando ? "Sugerir…" : "Sugerir auto"}</Text>
        </Pressable>
      </View>

      {aviso ? <K.Banner title={aviso} tone="RED" /> : null}

      {SECCIONES.map(({ comida, label, icon }) => {
        const fila = planesDia.find((p) => p.comida === comida);
        return (
          <View key={comida} style={styles.tarjeta}>
            <View style={styles.tarjetaCab}>
              <Icon name={icon} size={16} color={colors.primary} />
              <Text style={styles.tarjetaLabel}>{label}</Text>
            </View>

            {fila && fila.receta ? (
              <BloquePlanificado fila={fila} pantry={datos.pantry} ocupado={ocupado} quitar={quitar} />
            ) : (
              <Pressable
                onPress={() => go("PLA-06", { fecha: diaSel, comida })}
                style={({ pressed }) => [styles.vacio, pressed && styles.pressOn]}
              >
                <View style={styles.vacioMas}>
                  <Icon name="add" size={26} color={colors.primary} />
                </View>
                <Text style={styles.vacioTitulo}>+ Agregar receta o insumo rápido</Text>
                <Text style={styles.vacioSub} numberOfLines={2}>
                  {sugerenciaVacia}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}

      <Button label="Generar lista de compras" variant="outline" full onPress={generar} />
      <K.LinkText label="Volver al calendario" align="CENTER" onPress={() => go("PLA-05")} />
    </Screen>
  );
}

// "Semana del 18 al 24 de Nov" (meses abreviados; cambia de mes si cruza).
function etiquetaSemana(desde, hasta) {
  const d1 = deIso(desde);
  const d2 = deIso(hasta);
  const mes1 = MESES_ABREV[d1.getMonth()];
  const mes2 = MESES_ABREV[d2.getMonth()];
  if (mes1 === mes2) return `Semana del ${d1.getDate()} al ${d2.getDate()} de ${mes1}`;
  return `Semana del ${d1.getDate()} de ${mes1} al ${d2.getDate()} de ${mes2}`;
}

// Tarjeta de una comida ya planeada: foto con píldoras de precio e insumos,
// título, porciones, nota de faltantes y acciones (cambiar / quitar).
function BloquePlanificado({ fila, pantry, ocupado, quitar }) {
  const r = fila.receta;
  const v = ingredienteAlcanza(r, pantry, fila.porciones);
  const detalle =
    r.ingredientes_detalle && r.ingredientes_detalle.length
      ? r.ingredientes_detalle
      : (r.ingredientes || []).map((t) => ({ nombre: t }));
  const total = detalle.length;
  const listos = Math.max(0, total - v.faltantes.length);
  const fuente = resolverImagen(r.imagen);

  return (
    <View style={styles.bloque}>
      <Pressable
        onPress={() => go("REC-02", { receta: r.id })}
        style={({ pressed }) => [styles.fotoWrap, pressed && styles.pressOn]}
      >
        {fuente ? (
          <ExpoImage source={fuente} style={styles.foto} contentFit="cover" transition={150} cachePolicy="memory-disk" />
        ) : (
          <View style={[styles.foto, styles.fotoPh]}>
            <Icon name="restaurant-outline" size={38} color={colors.primary} />
          </View>
        )}
        {r.precio ? (
          <View style={styles.pillPrecio}>
            <Text style={styles.pillPrecioText}>{`${soles(r.precio)} total`}</Text>
          </View>
        ) : null}
        <View style={styles.pillEstado}>
          <Icon name={listos > 0 ? "checkmark" : "alert-circle-outline"} size={12} color={listos > 0 ? colors.green : colors.amber} />
          <Text style={[styles.pillEstadoText, listos === 0 && { color: colors.amber }]}>
            {listos === 0 ? "Ningún insumo en casa" : listos === total ? "Todos los insumos disponibles" : `${listos} de ${total} insumos listos`}
          </Text>
        </View>
      </Pressable>

      <Text style={styles.titulo} onPress={() => go("REC-02", { receta: r.id })} numberOfLines={2}>
        {r.nombre}
      </Text>
      <View style={styles.metaFila}>
        <Icon name="restaurant-outline" size={13} color={colors.muted} />
        <Text style={styles.meta}>{`${fila.porciones} porciones`}</Text>
      </View>
      {v.faltantes.length > 0 ? (
        <View style={styles.metaFila}>
          <Icon name="alert-circle-outline" size={13} color={colors.amber} />
          <Text style={[styles.meta, styles.metaFalta]} numberOfLines={2}>
            {`Falta: ${v.faltantes.slice(0, 3).join(", ")}${v.faltantes.length > 3 ? "…" : ""}`}
          </Text>
        </View>
      ) : null}

      <View style={styles.accionRow}>
        <View style={styles.accionBtn}>
          <Button label="⇄  Cambiar plato" variant="outline" onPress={() => go("PLA-06", { fecha: fila.fecha, comida: fila.comida, planId: fila.id })} />
        </View>
        <Pressable onPress={() => quitar(fila.id)} disabled={ocupado} hitSlop={8} style={({ pressed }) => [pressed && styles.pressOn, styles.basuraWrap]}>
          <View style={styles.basura}>
            <Icon name="trash-outline" size={18} color={colors.red} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function Flecha({ icon, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      style={({ pressed }) => [pressed && { opacity: 0.5 }, disabled && { opacity: 0.35 }]}
    >
      <Icon name={icon} size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressOn: { opacity: 0.85 },

  header: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 26, fontWeight: typography.weights.bold, color: colors.text, lineHeight: 31 },
  headerSub: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  headerSubText: { fontSize: typography.sizes.body, color: colors.sub },

  selRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  selLabel: { fontSize: 11, letterSpacing: 1, fontWeight: typography.weights.semibold, color: colors.muted },
  selSemana: { fontSize: typography.sizes.small, fontWeight: typography.weights.semibold, color: colors.primary },
  diasFila: { flexDirection: "row", alignItems: "center" },
  diasScroll: { flexGrow: 1, gap: 6, paddingHorizontal: 4 },
  diaChip: {
    width: 46,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  diaChipHoy: { backgroundColor: colors.primary, borderColor: colors.primary },
  diaChipSel: { borderColor: colors.primary, borderWidth: 2 },
  diaChipHoyTag: { fontSize: 8, fontWeight: typography.weights.bold, color: colors.white, letterSpacing: 1 },
  diaChipDow: { fontSize: typography.sizes.caption, color: colors.sub },
  diaChipNum: { fontSize: typography.sizes.body, fontWeight: typography.weights.bold, color: colors.text },
  diaChipTextoOn: { color: colors.white },

  menuRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.sm, marginBottom: 4 },
  menuTitulo: { flex: 1, fontSize: typography.sizes.subtitle, fontWeight: typography.weights.bold, color: colors.text },
  menuSugerir: { fontSize: typography.sizes.small, fontWeight: typography.weights.semibold, color: colors.primary },

  tarjeta: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.sm,
    ...shadows.card,
    marginBottom: spacing.sm,
  },
  tarjetaCab: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6, paddingHorizontal: 2 },
  tarjetaLabel: { flex: 1, fontSize: typography.sizes.label, fontWeight: typography.weights.bold, color: colors.text },

  bloque: { gap: 6 },
  fotoWrap: { height: 150, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.primaryLight },
  foto: { width: "100%", height: "100%" },
  fotoPh: { alignItems: "center", justifyContent: "center" },
  pillPrecio: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillPrecioText: { fontSize: typography.sizes.small, fontWeight: typography.weights.semibold, color: colors.primary },
  pillEstado: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.greenBg,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillEstadoText: { fontSize: typography.sizes.caption, color: colors.green, fontWeight: typography.weights.semibold },

  titulo: { fontSize: 17, fontWeight: typography.weights.bold, color: colors.text, lineHeight: 22 },
  metaFila: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 2 },
  meta: { flex: 1, fontSize: typography.sizes.small, color: colors.sub },
  metaFalta: { color: colors.amber },

  accionRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  accionBtn: { flex: 1 },
  basuraWrap: { width: 44, height: 48, justifyContent: "center" },
  basura: {
    width: 44,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  vacio: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    alignItems: "center",
    padding: spacing.md,
    gap: 4,
  },
  vacioMas: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  vacioTitulo: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.primary, textAlign: "center" },
  vacioSub: { fontSize: typography.sizes.small, color: colors.muted, textAlign: "center" },
});
