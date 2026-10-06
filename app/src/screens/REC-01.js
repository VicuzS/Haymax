import { useState } from "react";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { recipesMock } from "../data/mock";
import { faltantes, precioPorPorcion, soles } from "../lib/domain";

const FILTROS = ["Completas", "Casi listas", "Rápidas"];

export default function REC_01() {
  const [filtro, setFiltro] = useState("Completas");

  const conEstado = recipesMock.map((r) => ({ r, f: faltantes(r) }));
  const listas = filtro === "Completas"
    ? conEstado.filter((x) => x.f.length === 0)
    : filtro === "Casi listas"
      ? conEstado.filter((x) => x.f.length >= 1 && x.f.length <= 2)
      : conEstado.filter((x) => x.r.minutos <= 30);

  const titulo =
    filtro === "Completas"
      ? "Puedes cocinar completo"
      : filtro === "Casi listas"
        ? "Te falta poco"
        : "Listas en 30 minutos o menos";

  const faltanTotales = new Set();
  conEstado.forEach((x) => x.f.forEach((i) => faltanTotales.add(i)));

  return (
    <Screen id="REC-01" name="¿Qué puedo cocinar? (motor)">
      <K.Chips items={FILTROS} active={filtro} onPressItem={setFiltro} />
      <K.SectionTitle title={titulo} />

      {listas.length === 0 ? (
        <K.EmptyState title="Ninguna receta con este filtro" sub="Prueba con otro filtro o registra más insumos." />
      ) : (
        listas.map(({ r, f }) => (
          <K.PhotoCard
            key={r.id}
            imagen={r.imagen}
            title={r.nombre}
            sub={
              f.length === 0
                ? `${r.porciones} porciones · ${r.minutos} min · todo disponible`
                : `Falta: ${f.slice(0, 2).join(", ")}${f.length > 2 ? "…" : ""}`
            }
            price={`${soles(precioPorPorcion(r))} /poc.`}
            time={`${r.minutos} min`}
            status={f.length === 0 ? "Se puede preparar" : `Falta ${f.length} insumo${f.length > 1 ? "s" : ""}`}
            statusTone={f.length === 0 ? undefined : "amber"}
            cta="Ver →"
            onPress={() => go("REC-02", { receta: r.id })}
          />
        ))
      )}

      <K.Note text="Se muestran primero las recetas que ya puedes preparar." />
      <Button label="Ver recetas por distrito" variant="outline" full onPress={() => go("INI-03")} />
      <K.LinkText
        label={`Faltan ${faltanTotales.size} insumos → agregarlos a mi despensa`}
        onPress={() => go("DES-03")}
      />
      <K.LinkText label="Planificar con lo que tengo" onPress={() => go("PLA-01")} />
    </Screen>
  );
}
