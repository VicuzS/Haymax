import { useState } from "react";
import Screen from "../components/Screen";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import useApi from "../hooks/useApi";
import { getRecetas } from "../lib/api";
import { faltantes, precioPorPorcion, soles } from "../lib/domain";

const NOMBRE = "Recetas cerca de ti (por distrito)";
const DISTRITOS = ["Surquillo", "Miraflores", "Lima Norte"];

export default function INI_03() {
  const [distrito, setDistrito] = useState("Surquillo");
  const { data, loading, error, recargar } = useApi(getRecetas);

  if (loading) {
    return (
      <Screen id="INI-03" name={NOMBRE}>
        <K.Loading text="Buscando recetas cerca de ti…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="INI-03" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  return (
    <Screen id="INI-03" name={NOMBRE}>
      <K.SectionTitle title={`Recetas cerca de ${distrito}`} action="Actualizar" />
      <K.Chips items={DISTRITOS} active={distrito} onPressItem={setDistrito} />

      {data.recetas.map((r) => {
        const faltan = faltantes(r, data.pantry).length;
        return (
          <K.PhotoCard
            key={r.id}
            imagen={r.imagen}
            title={r.nombre}
            sub={`Plato típico · rinde ${r.porciones} porciones`}
            price={`${soles(precioPorPorcion(r))} /poc.`}
            time={`${r.minutos} min`}
            status={faltan === 0 ? "Se puede preparar" : `Falta ${faltan} ingrediente${faltan > 1 ? "s" : ""}`}
            statusTone={faltan === 0 ? undefined : "amber"}
            cta="Ver →"
            onPress={() => go("REC-02", { receta: r.id })}
          />
        );
      })}

      <K.LinkText label="Ver otros distritos" align="CENTER" />
    </Screen>
  );
}
