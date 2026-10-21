import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Screen from "../components/Screen";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, radius, spacing, typography, shadows } from "../tokens";
import useApi from "../hooks/useApi";
import { getMotor } from "../lib/api";
import { soles } from "../lib/domain";
import { fechaLarga } from "../lib/fechas";
import { resolverImagen } from "../lib/imagenes";

const NOMBRE = "Planificar: elegir platillo";
const COMIDAS = [
  { label: "Desayuno", value: "desayuno" },
  { label: "Almuerzo", value: "almuerzo" },
  { label: "Cena", value: "cena" },
];

// Estado visual según la cobertura de ingredientes que reporta el motor:
// 100% -> normal · parcial -> imagen en blanco y negro · 0% -> filtro rojizo.
// Los filtros se apilan como capas sobre la foto (mezcla por saturación).
function estadoDe(d) {
  if (d.cobertura >= 100) {
    return { capas: [], pill: "Tienes todos los ingredientes", tone: "green", pct: "100% disponible lista" };
  }
  if (d.cobertura > 0) {
    return { capas: [styles.filtroGris], pill: "Faltan algunos ingredientes", tone: "amber", pct: `${d.cobertura}% insumos listos` };
  }
  return {
    capas: [styles.filtroGris, styles.filtroRojo],
    pill: "No tiene los ingredientes",
    tone: "red",
    pct: "0% insumos listos",
  };
}

export default function PLA_06({ fecha, comida: comidaInicial, planId }) {
  const [comida, setComida] = useState(comidaInicial || "almuerzo");
  const { data, loading, error, recargar } = useApi(() => getMotor());

  if (loading) {
    return (
      <Screen id="PLA-06" name={NOMBRE}>
        <K.Loading text="Buscando platillos…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="PLA-06" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const recetas = data.recetas || [];
  const fechaTxt = fechaLarga(fecha);

  return (
    <Screen id="PLA-06" name={NOMBRE}>
      <K.SectionTitle title={fechaTxt} action={planId ? "Cambiando platillo" : undefined} />
      <K.SectionTitle title="¿Para qué comida?" />
      <K.Chips
        items={COMIDAS.map((c) => c.label)}
        active={(COMIDAS.find((c) => c.value === comida) || {}).label}
        onPressItem={(label) => setComida(COMIDAS.find((c) => c.label === label).value)}
      />
      <K.TextLine text={`${recetas.length} recetas recomendadas. Todos los platillos son seleccionables; si faltan ingredientes, podrás enviarlos a tu lista de compras.`} />

      {recetas.length === 0 && (
        <K.EmptyState title="No hay recetas disponibles" sub="Vuelve a intentarlo más tarde." />
      )}

      {recetas.map((r) => {
        const est = estadoDe(r);
        return (
          <TarjetaPlato
            key={r.id}
            plato={r}
            estado={est}
            onPress={() => go("PLA-07", { receta: r.id, fecha, comida, planId })}
          />
        );
      })}
    </Screen>
  );
}

function TarjetaPlato({ plato, estado, onPress }) {
  const fuente = resolverImagen(plato.imagen);
  const tono =
    estado.tone === "green"
      ? { bg: colors.greenBg, fg: colors.green }
      : estado.tone === "amber"
        ? { bg: colors.amberBg, fg: colors.amber }
        : { bg: colors.redBg, fg: colors.red };
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tarjeta, pressed && { opacity: 0.9 }]}>
      <View style={styles.fotoWrap}>
        {fuente ? (
          <Image source={fuente} style={styles.foto} contentFit="cover" transition={150} cachePolicy="memory-disk" />
        ) : (
          <View style={[styles.foto, styles.fotoPh]}>
            <Text style={styles.fotoPhText}>Platillo</Text>
          </View>
        )}
        {estado.capas.map((capa, k) => (
          <View key={k} style={[StyleSheet.absoluteFill, styles.overlay, capa]} />
        ))}
        <View style={styles.pillPrecio}>
          <Text style={styles.pillPrecioText}>{soles(plato.precio)} total</Text>
        </View>
        <View style={[styles.pillEstado, { backgroundColor: tono.bg }]}>
          <Text style={[styles.pillEstadoText, { color: tono.fg }]}>{estado.pill}</Text>
        </View>
      </View>
      <View style={styles.cuerpo}>
        <Text style={styles.titulo} numberOfLines={2}>{plato.nombre}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaItem}>⏱ {plato.minutos} min</Text>
          <Text style={styles.metaItem}>🍽 {plato.porciones} porc.</Text>
          <Text style={[styles.metaItem, { color: tono.fg }]}>{estado.pct}</Text>
        </View>
        <Text style={styles.cta}>Elegir este platillo →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.card,
    marginBottom: spacing.sm,
  },
  fotoWrap: { height: 140, backgroundColor: colors.primaryLight },
  foto: { width: "100%", height: "100%" },
  fotoPh: { alignItems: "center", justifyContent: "center" },
  fotoPhText: { color: colors.primary, fontSize: typography.sizes.small },
  overlay: {},
  // B/N real: la capa gris desatura la foto (mezcla por saturación).
  filtroGris: { backgroundColor: "#9E9E9E", mixBlendMode: "saturation" },
  // Wash rojizo encima de la desaturación (0% de cobertura).
  filtroRojo: { backgroundColor: "rgba(198,40,40,0.5)" },
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
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillEstadoText: { fontSize: typography.sizes.caption, fontWeight: typography.weights.semibold },
  cuerpo: { padding: 12, gap: 4 },
  titulo: { fontSize: 16, fontWeight: typography.weights.bold, color: colors.text },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metaItem: { fontSize: typography.sizes.small, color: colors.sub },
  cta: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.primary },
});
