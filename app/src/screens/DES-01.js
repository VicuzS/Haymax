import { useState } from "react";
import Screen from "../components/Screen";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors } from "../tokens";
import { pantryMock } from "../data/mock";
import { pantryStats } from "../lib/domain";

const CATS = ["Todos", "Verduras", "Lácteos", "Secos", "Carnes"];
const CAT_ICON = { Verduras: "leaf-outline", Lácteos: "water-outline", Secos: "cube-outline", Carnes: "restaurant-outline" };

const ESTADO = {
  ok: { txt: "", color: null },
  "por-vencer": { txt: " · por vencer", color: colors.amber },
  vencido: { txt: " · vencido", color: colors.red },
};

export default function DES_01() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todos");
  const stats = pantryStats();

  const lista = pantryMock.filter((p) => {
    const okCat = cat === "Todos" || p.categoria === cat;
    const okQ = p.nombre.toLowerCase().includes(q.trim().toLowerCase());
    return okCat && okQ;
  });

  return (
    <Screen id="DES-01" name="Mi despensa (lista)">
      <K.InputField placeholder="Buscar insumo…" value={q} onChangeText={setQ} />
      <K.Chips items={CATS} active={cat} onPressItem={setCat} />

      {lista.length === 0 ? (
        <K.EmptyState title="Sin resultados" sub="Prueba otra categoría o limpia la búsqueda." />
      ) : (
        lista.map((p) => {
          const e = ESTADO[p.estado] || ESTADO.ok;
          return (
            <K.Row
              key={p.id}
              label={p.nombre}
              value={`${p.cantidad} ${p.unidad}${e.txt}`}
              valueColor={e.color || undefined}
              icon={CAT_ICON[p.categoria]}
              onPress={() => go("DES-02", { insumo: p.id })}
            />
          );
        })
      )}

      <K.Note
        text={
          stats.porVencer + stats.vencidos > 0
            ? `${stats.porVencer + stats.vencidos} insumos vencen en menos de 3 días: revisa la alerta.`
            : "Ningún insumo está por vencer."
        }
        onPress={() => go("PRE-03")}
      />
      <K.LinkText
        label="Lo que falta está en tu lista de compras"
        align="CENTER"
        onPress={() => go("COM-01")}
      />
    </Screen>
  );
}
