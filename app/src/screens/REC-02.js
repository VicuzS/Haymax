import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors } from "../tokens";
import useApi from "../hooks/useApi";
import { getRecetaDetalle, agregarFavorito, quitarFavorito } from "../lib/api";
import { hoyIso } from "../lib/fechas";
import { norm, precioPorPorcion, ahorroPorPorcion, soles, dificultadTexto } from "../lib/domain";

const NOMBRE = "Detalle de receta";

export default function REC_02({ receta }) {
  const { data, loading, error, recargar } = useApi(() => getRecetaDetalle(receta));
  const [favLocal, setFavLocal] = useState(null);

  if (loading) {
    return (
      <Screen id="REC-02" name={NOMBRE}>
        <K.Loading text="Cargando receta…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="REC-02" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const r = data.receta;
  const favorito = favLocal == null ? !!r.esFavorito : favLocal;
  const faltantes = (data.disponibilidad && data.disponibilidad.faltantes) || [];
  const faltaIngrediente = (nombre) => faltantes.some((f) => norm(f).includes(norm(nombre)));
  const ahorro = ahorroPorPorcion(r);

  const ingredientes =
    r.ingredientes_detalle && r.ingredientes_detalle.length
      ? r.ingredientes_detalle.map((i) => ({
          key: String(i.id),
          nombre: i.nombre,
          label: [i.cantidad, i.unidad_medida, i.nombre].filter((x) => x != null && x !== "").join(" "),
          opcional: !!i.opcional,
        }))
      : (r.ingredientes || []).map((s, idx) => ({
          key: s + idx,
          nombre: s.replace(/^[0-9.,]+\s*\S*\s*(de\s+)?/i, ""),
          label: s,
          opcional: false,
        }));

  const alternarFavorito = async () => {
    const nuevo = !favorito;
    setFavLocal(nuevo);
    try {
      if (nuevo) await agregarFavorito(r.id);
      else await quitarFavorito(r.id);
    } catch (_e) {
      setFavLocal(!nuevo);
    }
  };

  return (
    <Screen id="REC-02" name={NOMBRE}>
      <View style={styles.heroWrap}>
        <K.Hero
          imagen={r.imagen}
          title={r.nombre}
          price={`${soles(precioPorPorcion(r))} /poc.`}
          time={`${r.minutos} min`}
        />
        <K.Heart activo={favorito} onPress={alternarFavorito} style={styles.heart} />
      </View>

      <K.SectionTitle title="Datos" />
      <View style={styles.rows}>
        <K.Row label="Porciones" value={String(r.porciones)} icon="👥" />
        <K.Row label="Tiempo total" value={`${r.minutos} min`} icon="⏱" />
        <K.Row label="Dificultad" value={dificultadTexto(r.dificultad)} icon="★" />
      </View>

      <K.Card
        title="Cálculo Hogar & Ahorro"
        sub={`En casa ${soles(ahorro.enCasa)} por porción · delivery ${soles(ahorro.delivery)}`}
        right={`−${ahorro.pct}%`}
      />

      <K.SectionTitle title="Ingredientes" />
      <View style={styles.rows}>
        {ingredientes.map((ing) => {
          const ok = ing.opcional || !faltaIngrediente(ing.nombre);
          return (
            <K.Row
              key={ing.key}
              label={ing.label}
              value={ing.opcional ? "Opcional" : ok ? "En stock" : "Falta"}
              valueColor={ing.opcional ? colors.muted : ok ? undefined : colors.amber}
              icon={ing.opcional ? "☆" : ok ? "✓" : "!"}
            />
          );
        })}
      </View>

      {faltantes.length > 0 ? (
        <K.LinkText
          label="Agregar faltantes a mi lista de compras"
          align="CENTER"
          onPress={() => go("COM-01")}
        />
      ) : null}

      <K.Card
        title="Balance nutricional"
        sub={`${r.calorias} kcal por porción · rinde ${r.porciones} porciones · ${faltantes.length === 0 ? "todo disponible" : `faltan ${faltantes.length} insumos`}`}
      />

      <Button label="Planificar este plato" full onPress={() => go("PLA-07", { receta: r.id, fecha: hoyIso(), comida: "almuerzo" })} />
      <Button label="Cocinar ahora" variant="outline" full onPress={() => go("PRE-01", { receta: r.id })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  rows: { gap: 0 },
  heroWrap: { position: "relative" },
  heart: { position: "absolute", top: 12, right: 12 },
});
