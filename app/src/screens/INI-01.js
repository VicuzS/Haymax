import Screen from "../components/Screen";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { recipesMock, mealPlanMock } from "../data/mock";
import { recetaById, precioPorPorcion, soles, pantryStats, shoppingProgress, balanceSemanal } from "../lib/domain";

const HOY = { dia: "martes", fecha: "Martes 19 de noviembre · Surquillo" };

export default function INI_01() {
  const plan = mealPlanMock.find((m) => m.dia === HOY.dia) || mealPlanMock[0];
  const recetaHoy = recetaById(plan.recetaId);
  const stats = pantryStats();
  const shop = shoppingProgress();
  const sugerida = recipesMock[0];
  const atencion = stats.porVencer + stats.vencidos;
  const balance = balanceSemanal();

  return (
    <Screen id="INI-01" name="Inicio: plato planeado hoy">
      <K.Header title="Hola, Rosa" sub={HOY.fecha} />

      <K.Card
        thumb={recetaHoy.imagen}
        title="Plato planeado hoy"
        sub={`${plan.comida} · ${recetaHoy.nombre} · ${plan.porciones} porciones`}
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
