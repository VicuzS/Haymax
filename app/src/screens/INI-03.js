import { useState } from "react";
import Screen from "../components/Screen";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { recipesMock } from "../data/mock";
import { faltantes, precioPorPorcion, soles } from "../lib/domain";

const DISTRITOS = ["Surquillo", "Miraflores", "Lima Norte"];

export default function INI_03() {
  const [distrito, setDistrito] = useState("Surquillo");

  return (
    <Screen id="INI-03" name="Recetas cerca de ti (por distrito)">
      <K.SectionTitle title={`Recetas cerca de ${distrito}`} action="Actualizar" />
      <K.Chips items={DISTRITOS} active={distrito} onPressItem={setDistrito} />

      {recipesMock.map((r) => {
        const faltan = faltantes(r).length;
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
