import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors } from "../tokens";
import { pantryMock } from "../data/mock";

export default function PRE_03() {
  const atencion = pantryMock.filter((p) => p.estado !== "ok");

  return (
    <Screen id="PRE-03" name="Alerta: insumos por vencer">
      <K.Banner
        title={atencion.length > 0 ? `Vencen pronto · ${atencion.length} insumos` : "Sin alertas de vencimiento"}
        sub="Revísalos hoy para no desperdiciarlos"
        tone="PRIMARY"
      />

      {atencion.length === 0 ? (
        <K.EmptyState title="Nada por vencer" sub="Tu despensa está al día." />
      ) : (
        <>
          <K.SectionTitle title="Usarlos ya" />
          {atencion.map((p) => (
            <K.Card
              key={p.id}
              title={`${p.nombre} · ${p.cantidad} ${p.unidad}`}
              sub={p.estado === "vencido" ? "Vencido — úsalo hoy" : "Por vencer"}
              subColor={p.estado === "vencido" ? colors.red : colors.amber}
              right="Ver"
              onPress={() => go("REC-02")}
            />
          ))}
        </>
      )}

      <Button label="Cocinar con estos insumos" full onPress={() => go("REC-01")} />
      <Button label="Marcar como descartado" variant="outline" full onPress={() => go("DES-01")} />
      <K.LinkText
        label="Editar el ítem desde la despensa"
        onPress={() => go("DES-02", { insumo: atencion[0] ? atencion[0].id : undefined })}
      />
    </Screen>
  );
}
