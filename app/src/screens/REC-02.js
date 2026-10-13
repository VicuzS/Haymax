import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors } from "../tokens";
import useApi from "../hooks/useApi";
import { getReceta } from "../lib/api";
import { faltantes, ingredienteCubierto, precioPorPorcion, ahorroPorPorcion, soles, dificultadTexto } from "../lib/domain";

const NOMBRE = "Detalle de receta";

export default function REC_02({ receta }) {
  const { data, loading, error, recargar } = useApi(() => getReceta(receta));

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
  const pantry = data.pantry;
  const faltan = faltantes(r, pantry);
  const ahorro = ahorroPorPorcion(r);

  return (
    <Screen id="REC-02" name={NOMBRE}>
      <K.Hero
        imagen={r.imagen}
        title={r.nombre}
        price={`${soles(precioPorPorcion(r))} /poc.`}
        time={`${r.minutos} min`}
      />

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
        {r.ingredientes.map((ing) => {
          const ok = ingredienteCubierto(ing, pantry);
          return (
            <K.Row
              key={ing}
              label={ing}
              value={ok ? "En stock" : "Falta"}
              valueColor={ok ? undefined : colors.amber}
              icon={ok ? "✓" : "!"}
            />
          );
        })}
      </View>

      {faltan.length > 0 ? (
        <K.LinkText
          label="Agregar faltantes a mi lista de compras"
          align="CENTER"
          onPress={() => go("COM-01")}
        />
      ) : null}

      <K.Card
        title="Balance nutricional"
        sub={`${r.calorias} kcal por porción · rinde ${r.porciones} porciones · ${faltan.length === 0 ? "todo disponible" : `faltan ${faltan.length} insumos`}`}
      />

      <Button label="Planificar este plato" full onPress={() => go("PLA-01", { receta: r.id })} />
      <Button label="Cocinar ahora" variant="outline" full onPress={() => go("PRE-01", { receta: r.id })} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 0 } });
