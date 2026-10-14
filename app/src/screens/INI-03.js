import { useEffect, useRef, useState } from "react";
import Screen from "../components/Screen";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import useApi from "../hooks/useApi";
import { getRecetasPorDistrito } from "../lib/api";
import { soles } from "../lib/domain";

const NOMBRE = "Recetas cerca de ti (por distrito)";
const DISTRITOS = ["Surquillo", "Miraflores", "Lima Norte"];

export default function INI_03() {
  const [distrito, setDistrito] = useState("Surquillo");
  const { data, loading, error, recargar } = useApi(() => getRecetasPorDistrito(distrito));
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    recargar();
  }, [distrito, recargar]);

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

  const recetas = data || [];

  return (
    <Screen id="INI-03" name={NOMBRE}>
      <K.SectionTitle title={`Recetas cerca de ${distrito}`} action="Actualizar" onPress={recargar} />
      <K.Chips items={DISTRITOS} active={distrito} onPressItem={setDistrito} />

      {recetas.length === 0 ? (
        <K.EmptyState title="Sin recetas en este distrito" sub="Prueba con otro distrito." />
      ) : (
        recetas.map((r) => (
          <K.PhotoCard
            key={r.id}
            imagen={r.imagen}
            title={r.nombre}
            sub={`Plato típico · rinde ${r.porciones} porciones`}
            price={`${soles(r.precio / (r.porciones || 1))} /poc.`}
            time={`${r.minutos} min`}
            status={r.disponible ? "Se puede preparar" : `Falta ${r.faltantes_count} ingrediente${r.faltantes_count > 1 ? "s" : ""}`}
            statusTone={r.disponible ? undefined : "amber"}
            cta="Ver →"
            onPress={() => go("REC-02", { receta: r.id })}
          />
        ))
      )}

      <K.LinkText label="Ver otros distritos" align="CENTER" />
    </Screen>
  );
}
