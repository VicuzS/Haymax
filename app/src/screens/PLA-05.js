import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import Icon from "../components/Icon";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, radius, spacing, typography } from "../tokens";
import { getPlanesEntre } from "../lib/api";
import { cuadriculaMes, hoyIso, deIso, MESES_ES } from "../lib/fechas";

const NOMBRE = "Calendario de planificación";
const COMIDAS = ["desayuno", "almuerzo", "cena"];

// Grilla de 6 semanas x 7 días (arranca en lunes) — ver lib/fechas.js.
function armarGrilla(anio, mes0) {
  const celdas = cuadriculaMes(anio, mes0);
  const filas = [];
  for (let i = 0; i < celdas.length; i += 7) filas.push(celdas.slice(i, i + 7));
  return { filas, desde: celdas[0].iso, hasta: celdas[celdas.length - 1].iso };
}

// Calendario mensual interactivo: navega entre meses y años, marca con "F"
// los días que ya tienen las 3 comidas planificadas y al tocar un día abre
// la selección de platillo (PLA-06) para ese día.
export default function PLA_05() {
  const hoy = hoyIso();
  const dHoy = deIso(hoy);
  const [anio, setAnio] = useState(dHoy.getFullYear());
  const [mes0, setMes0] = useState(dHoy.getMonth());

  const vista = armarGrilla(anio, mes0);
  const [marcas, setMarcas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Recarga del plan cada vez que cambia el mes/año visible (o al volver al
  // foco), para que las marcas "F" reflejen lo guardado en la API.
  useEffect(() => {
    let vivo = true;
    Promise.resolve()
      .then(() => {
        if (!vivo) return undefined;
        setCargando(true);
        setError(null);
        setMarcas({});
        return getPlanesEntre(vista.desde, vista.hasta);
      })
      .then((planes) => {
        if (!vivo) return;
        const porDia = {};
        (planes || []).forEach((p) => {
          porDia[p.fecha] = porDia[p.fecha] || new Set();
          porDia[p.fecha].add(p.comida);
        });
        const marcasNuevas = {};
        Object.keys(porDia).forEach((fecha) => {
          const comidas = porDia[fecha];
          const cuantas = COMIDAS.filter((c) => comidas.has(c)).length;
          marcasNuevas[fecha] = { cuantas, completo: cuantas >= COMIDAS.length };
        });
        setMarcas(marcasNuevas);
        setCargando(false);
      })
      .catch((e) => {
        if (!vivo) return;
        setError((e && e.message) || "No se pudo cargar el calendario.");
        setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [vista.desde, vista.hasta]);

  const moverMes = (d) => {
    const t = new Date(anio, mes0 + d, 1);
    setAnio(t.getFullYear());
    setMes0(t.getMonth());
  };
  const moverAnio = (d) => setAnio((a) => a + d);
  const hoyBtn = () => {
    setAnio(dHoy.getFullYear());
    setMes0(dHoy.getMonth());
  };

  return (
    <Screen id="PLA-05" name={NOMBRE}>
      <View style={styles.cabecera}>
        <View style={styles.mesFila}>
          <Flecha icon="chevron-back" onPress={() => moverMes(-1)} />
          <Text style={styles.mesTitulo}>
            {MESES_ES[mes0].charAt(0).toUpperCase() + MESES_ES[mes0].slice(1)} {anio}
          </Text>
          <Flecha icon="chevron-forward" onPress={() => moverMes(1)} />
        </View>
        <View style={styles.anioFila}>
          <Pressable onPress={moverAnio.bind(null, -1)} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.5 }}>
            <Text style={styles.anioBoton}>{String(anio - 1)}</Text>
          </Pressable>
          <Pressable onPress={hoyBtn} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.5 }}>
            <Text style={[styles.anioBoton, styles.anioBotonActivo]}>Hoy</Text>
          </Pressable>
          <Pressable onPress={moverAnio.bind(null, 1)} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.5 }}>
            <Text style={styles.anioBoton}>{String(anio + 1)}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.semanaRow}>
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((l) => (
          <Text key={l} style={styles.semanaDia}>
            {l}
          </Text>
        ))}
      </View>

      {error ? (
        <K.ErrorState text={error} onRetry={hoyBtn} />
      ) : (
        <View style={styles.grilla}>
          {vista.filas.map((fila, fi) => (
            <View key={`fila-${fi}`} style={styles.fila}>
              {fila.map((celda) => {
                const marca = marcas[celda.iso];
                const completo = !!(marca && marca.completo);
                return (
                  <Pressable
                    key={celda.iso}
                    onPress={celda.fuera ? undefined : () => go("PLA-06", { fecha: celda.iso })}
                    disabled={celda.fuera}
                    style={[
                      styles.celda,
                      celda.fuera && styles.celdaFuera,
                      celda.iso === hoy && styles.celdaHoy,
                    ]}
                  >
                    <Text style={[styles.num, celda.fuera && styles.numFuera, celda.iso === hoy && styles.numHoy]}>
                      {celda.dia}
                    </Text>
                    {completo ? (
                      <Text style={styles.full}>F</Text>
                    ) : (
                      <View style={styles.puntos}>
                        {marca &&
                          Array.from({ length: marca.cuantas }).map((_, k) => (
                            <View key={k} style={styles.punto} />
                          ))}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      )}

      {cargando ? <K.Loading text="Cargando tu plan…" /> : null}

      <K.Note text='La "F" indica un día completo: desayuno, almuerzo y cena ya planificados. Toca cualquier día para armar el menú.' />
      <Button label="Ver mi plan de la semana" variant="outline" full onPress={() => go("PLA-09", { fecha: hoy })} />
    </Screen>
  );
}

function Flecha({ icon, onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={({ pressed }) => pressed && { opacity: 0.5 }}>
      <Icon name={icon} size={22} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 4,
  },
  mesFila: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  mesTitulo: { fontSize: 22, fontWeight: typography.weights.bold, color: colors.text },
  anioFila: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 2 },
  anioBoton: { fontSize: 13, color: colors.muted, fontWeight: typography.weights.semibold },
  anioBotonActivo: { color: colors.primary, fontWeight: typography.weights.bold },

  semanaRow: { flexDirection: "row", paddingHorizontal: 2 },
  semanaDia: { flex: 1, textAlign: "center", fontSize: typography.sizes.caption, fontWeight: typography.weights.semibold, color: colors.muted },

  grilla: { gap: 4 },
  fila: { flexDirection: "row", gap: 4 },
  celda: {
    flex: 1,
    aspectRatio: 0.92,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  celdaFuera: { backgroundColor: colors.field, borderColor: colors.field },
  celdaHoy: { backgroundColor: colors.primary, borderColor: colors.primary },
  num: { fontSize: 13, fontWeight: typography.weights.semibold, color: colors.text },
  numFuera: { color: colors.muted },
  numHoy: { color: colors.white },
  full: { fontSize: 12, fontWeight: typography.weights.bold, color: colors.green, marginTop: -2 },
  puntos: { flexDirection: "row", gap: 2 },
  punto: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary },
});
