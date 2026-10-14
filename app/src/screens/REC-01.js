import { useState } from "react";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import useApi from "../hooks/useApi";
import { getMotor } from "../lib/api";
import { soles } from "../lib/domain";

const NOMBRE = "¿Qué puedo cocinar? (motor)";
const FILTROS = ["Completas", "Casi listas", "Rápidas", "Favoritas"];

export default function REC_01() {
  const [filtro, setFiltro] = useState("Completas");
  const { data, loading, error, recargar } = useApi(getMotor);

  if (loading) {
    return (
      <Screen id="REC-01" name={NOMBRE}>
        <K.Loading text="Buscando recetas…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="REC-01" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const favoritas = new Set(data.favoritos || []);
  const recetas = data.recetas || [];

  const filtradas =
    filtro === "Completas"
      ? recetas.filter((r) => r.disponible)
      : filtro === "Casi listas"
        ? recetas.filter((r) => !r.disponible && r.faltantes_count <= 2)
        : filtro === "Rápidas"
          ? recetas.filter((r) => r.minutos <= 30)
          : recetas.filter((r) => favoritas.has(r.id));

  const titulo =
    filtro === "Completas"
      ? "Puedes cocinar completo"
      : filtro === "Casi listas"
        ? "Te falta poco"
        : filtro === "Rápidas"
          ? "Listas en 30 minutos o menos"
          : "Tus recetas favoritas";

  const faltanTotales = new Set();
  recetas.forEach((r) => (r.faltantes || []).forEach((i) => faltanTotales.add(i)));

  return (
    <Screen id="REC-01" name={NOMBRE}>
      <K.Chips items={FILTROS} active={filtro} onPressItem={setFiltro} />
      <K.SectionTitle title={titulo} />

      {filtradas.length === 0 ? (
        <K.EmptyState
          title={filtro === "Favoritas" ? "Aún no tienes favoritas" : "Ninguna receta con este filtro"}
          sub={
            filtro === "Favoritas"
              ? "Marca el corazón en el detalle de una receta."
              : "Prueba con otro filtro o registra más insumos."
          }
        />
      ) : (
        filtradas.map((r) => (
          <K.PhotoCard
            key={r.id}
            imagen={r.imagen}
            title={r.nombre}
            sub={
              r.disponible
                ? `${r.porciones} porciones · ${r.minutos} min · todo disponible`
                : `Falta: ${r.faltantes.slice(0, 2).join(", ")}${r.faltantes_count > 2 ? "…" : ""}`
            }
            price={`${soles(r.precio / (r.porciones || 1))} /poc.`}
            time={`${r.minutos} min`}
            status={r.disponible ? "Se puede preparar" : `Falta ${r.faltantes_count} insumo${r.faltantes_count > 1 ? "s" : ""}`}
            statusTone={r.disponible ? undefined : "amber"}
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
