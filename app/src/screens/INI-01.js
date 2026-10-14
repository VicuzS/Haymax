import Screen from "../components/Screen";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import useApi from "../hooks/useApi";
import { getInicio } from "../lib/api";
import { precioPorPorcion, soles } from "../lib/domain";

const NOMBRE = "Inicio: plato planeado hoy";

export default function INI_01() {
  const { data, loading, error, recargar } = useApi(getInicio);

  if (loading) {
    return (
      <Screen id="INI-01" name={NOMBRE}>
        <K.Loading text="Cargando tu inicio…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="INI-01" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const { hoy, primerNombre, inicial, plan, recetaHoy, sugerida, stats, shop, balance, atencion } = data;
  const comida = (plan && plan.comida) || "almuerzo";
  const porciones = (plan && plan.porciones) || recetaHoy.porciones;

  return (
    <Screen id="INI-01" name={NOMBRE}>
      <K.Header iniciales={inicial} title={`Hola, ${primerNombre}`} sub={hoy.fecha} />

      <K.Card
        thumb={recetaHoy.imagen}
        title="Plato planeado hoy"
        sub={`${comida} · ${recetaHoy.nombre} · ${porciones} porciones`}
        right="Ver"
        onPress={() => go("REC-02", { receta: recetaHoy.id })}
      />
      <K.Card
        title="Lista de compras"
        sub={`${shop.listos} de ${shop.total} artículos listos`}
        right="Ver"
        onPress={() => go("COM-01")}
      />

      <K.SectionTitle title="Acciones rápidas" />
      <K.QuickAction
        icon="checkmark-done-outline"
        label="Ya lo preparé"
        sub="Descontar insumos de mi despensa"
        onPress={() => go("PRE-01")}
      />
      <K.QuickAction
        icon="restaurant-outline"
        label="Planificar un plato nuevo"
        sub="Armar el menú de la semana"
        variant="primary"
        onPress={() => go("PLA-01")}
      />
      <K.QuickAction
        icon="calendar-outline"
        label="Ver mi plan de la semana"
        onPress={() => go("PLA-05")}
      />

      <K.SectionTitle title="Tu despensa" action="Ver todo" onPress={() => go("DES-01")} />
      <K.Chips
        items={[
          { label: `${stats.disponibles} disponibles`, tone: "green" },
          { label: `${stats.porVencer} por vencer`, tone: "amber" },
          { label: `${stats.vencidos} vencidos`, tone: "red" },
        ]}
      />
      <K.Note
        text={`${atencion} insumos requieren atención: revísalos hoy.`}
        onPress={() => go("PRE-03")}
      />

      <K.SectionTitle title="¿Qué puedo cocinar?" action="Abrir motor" onPress={() => go("REC-01")} />
      <K.Card
        title={sugerida.nombre}
        sub={`${sugerida.porciones} porciones · ${sugerida.minutos} min · ${soles(precioPorPorcion(sugerida))} por porción`}
        right="Ver"
        onPress={() => go("REC-02", { receta: sugerida.id })}
      />

      <K.Stat value="S/ 42" label="Ahorro acumulado vs delivery" delta="+ S/ 12" />
      <K.BalanceCard
        label="BALANCE DE LA SEMANA"
        pct={`${balance.pct}%`}
        text={balance.texto}
        link="Ver resumen nutricional →"
        onPress={() => go("SAL-01")}
      />
      <K.SectionTitle title="Precios e insumos cerca de ti" action="Otros distritos" onPress={() => go("INI-03")} />
    </Screen>
  );
}
