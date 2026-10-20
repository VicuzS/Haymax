import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import Icon from "../components/Icon";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, radius, spacing, typography } from "../tokens";
import useApi from "../hooks/useApi";
import { getPlanSemana, eliminarPlan, generarListaCompras } from "../lib/api";
import { faltantes, soles } from "../lib/domain";
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
const PLATOS_META = 14; // 7 días x 2 comidas por día (meta de la semana)
const DIAS_SEMANA = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

// Plan de la semana interactivo: días deslizables y clicables, y debajo las
// 3 comidas del día seleccionado (con cambiar plato / quitar).
export default function PLA_09({ fecha }) {
  const hoy = hoyIso();
  const { data, loading, error, recargar } = useApi(getPlanSemana);
  const [offsetSemana, setOffsetSemana] = useState(0);
  const ancla = fecha || hoy;
  const [sel, setSel] = useState(ancla);

  const lunes = sumarDiasIso(lunesDeIso(ancla), offsetSemana * 7);
  const finSemana = sumarDiasIso(lunes, 6);
  const dias = Array.from({ length: 7 }, (_, i) => {
    const iso = sumarDiasIso(lunes, i);
    return { iso, num: deIso(iso).getDate(), corto: DIAS_CORTOS[i], esHoy: iso === hoy };
  });

  if (loading) {
    return (
      <Screen id="PLA-09" name={NOMBRE}>
        <K.Loading text="Cargando tu plan…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="PLA-09" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const diaSel = dias.some((d) => d.iso === sel) ? sel : lunes;
  const planesDia = data.plan.filter((p) => p.fecha === diaSel);
  const planesSemana = data.plan.filter((p) => p.fecha >= lunes && p.fecha <= finSemana);
  const pct = planesSemana.length / PLATOS_META;
  const bonito = diaBonito(DIAS_SEMANA[deIso(diaSel).getDay()]);

  const quitar = async (id) => {
    await eliminarPlan(id);
    recargar({ silencioso: true });
  };

  const generar = async () => {
    await generarListaCompras(diaSel);
    go("COM-01");
  };

  return (
    <Screen id="PLA-09" name={NOMBRE}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plan de la semana</Text>
        <Text style={styles.headerSub}>
          {`Semana del ${deIso(lunes).getDate()} al ${deIso(finSemana).getDate()} de ${MESES_ABREV(deIso(lunes).getMonth())}`}
        </Text>
        <View style={styles.semanaChip}>
          <Text style={styles.semanaChipText}>{`Semana ${semanaNumero(lunes)}`}</Text>
        </View>
      </View>

      <K.Progress
        label={`${Math.round(pct * 100)}% de insumos listos en tu alacena`}
        right={`${planesSemana.length}/${PLATOS_META} platos`}
        pct={pct}
      />

      <K.SectionTitle title="Selecciona el día" action={`Semana ${semanaNumero(lunes)}`} />
      <View style={styles.diasFila}>
        <Flecha icon="chevron-back" onPress={() => setOffsetSemana((o) => o - 1)} />
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
        <Flecha icon="chevron-forward" onPress={() => setOffsetSemana((o) => o + 1)} />
      </View>

      <K.SectionTitle
        title={`Menú del ${bonito.charAt(0).toUpperCase() + bonito.slice(1)}`}
        action={`${planesDia.length} platos`}
      />

      {SECCIONES.map(({ comida, label, icon }) => {
        const fila = planesDia.find((p) => p.comida === comida);
        return (
          <View key={comida} style={styles.seccion}>
            <View style={styles.seccionCab}>
              <Icon name={icon} size={16} color={colors.primary} />
              <Text style={styles.seccionTitulo}>{label}</Text>
              {fila ? (
                <K.Chips items={[`${fila.porciones} porc.`]} ok />
              ) : (
                <K.Chips items={["Sin asignar"]} />
              )}
            </View>

            {fila && fila.receta ? (
              <View style={styles.bloque}>
                <K.Card
                  thumb={fila.receta.imagen}
                  title={fila.receta.nombre}
                  sub={subInsumos(fila.receta, data.pantry, fila.porciones)}
                  subColor={colorInsumos(fila.receta, data.pantry)}
                  right={soles(fila.receta.precio) + " total"}
                  onPress={() => go("REC-02", { receta: fila.receta.id })}
                />
                <View style={styles.acciones}>
                  <Button
                    label="⇄  Cambiar plato"
                    variant="outline"
                    onPress={() => go("PLA-06", { fecha: diaSel, comida, planId: fila.id })}
                  />
                  <Pressable onPress={() => quitar(fila.id)} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.6 }}>
                    <View style={styles.basura}>
                      <Icon name="trash-outline" size={18} color={colors.red} />
                    </View>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.vacio}>
                <Text style={styles.vacioTexto}>Aún no se ha planificado ningún platillo aquí</Text>
                <K.LinkText
                  label={`+ Agregar receta para ${label.toLowerCase()}`}
                  onPress={() => go("PLA-06", { fecha: diaSel, comida })}
                />
              </View>
            )}
          </View>
        );
      })}

      <Button label="Generar lista de compras" variant="outline" full onPress={generar} />
      <K.LinkText label="Volver al calendario" align="CENTER" onPress={() => go("PLA-05")} />
    </Screen>
  );
}

function MESES_ABREV(m) {
  return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][m];
}

function subInsumos(receta, pantry, porciones) {
  const total = (receta.ingredientes || []).length;
  const f = faltantes(receta, pantry).length;
  const listos = total - f;
  return `${porciones || receta.porciones} porciones · ${listos} de ${total} insumos listos`;
}

function colorInsumos(receta, pantry) {
  const f = faltantes(receta, pantry).length;
  return f === 0 ? colors.green : colors.amber;
}

function Flecha({ icon, onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={({ pressed }) => pressed && { opacity: 0.6 }}>
      <Icon name={icon} size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  headerSub: { fontSize: typography.sizes.body, color: colors.sub, marginTop: 4 },
  semanaChip: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  semanaChipText: { fontSize: typography.sizes.caption, fontWeight: typography.weights.semibold, color: colors.primary },

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

  seccion: { marginBottom: 4 },
  seccionCab: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  seccionTitulo: { fontSize: typography.sizes.subtitle, fontWeight: typography.weights.bold, color: colors.text, flex: 1 },

  bloque: { gap: 4 },
  acciones: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
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
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    alignItems: "center",
    padding: spacing.md,
    gap: 4,
  },
  vacioTexto: { fontSize: typography.sizes.body, color: colors.sub, textAlign: "center" },
});
