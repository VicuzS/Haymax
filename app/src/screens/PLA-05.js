import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors } from "../tokens";
import { recetaById, faltantes, comidasDelDia, planCobertura, faltantesDelPlan } from "../lib/domain";

const DIAS = [
  ["Lu", "lunes", "Lunes 18 de noviembre"],
  ["Ma", "martes", "Martes 19 de noviembre"],
  ["Mi", "miercoles", "Miércoles 20 de noviembre"],
  ["Ju", "jueves", "Jueves 21 de noviembre"],
  ["Vi", "viernes", "Viernes 22 de noviembre"],
  ["Sá", "sabado", "Sábado 23 de noviembre"],
  ["Do", "domingo", "Domingo 24 de noviembre"],
];

export default function PLA_05() {
  const [sel, setSel] = useState("Ma");
  const actual = DIAS.find((d) => d[0] === sel) || DIAS[1];
  const comidas = comidasDelDia(actual[1]);
  const cob = planCobertura();
  const porComprar = faltantesDelPlan().length;

  return (
    <Screen id="PLA-05" name="Mi plan de la semana">
      <K.Chips items={DIAS.map((d) => d[0])} active={sel} onPressItem={setSel} />
      <K.SectionTitle title="Semana del 18–24 de noviembre" action="‹  ›" />
      <K.SectionTitle title={actual[2]} />

      {comidas.length === 0 ? (
        <K.TextLine text="Sin platos para este día. Planifícalos con el botón de abajo." />
      ) : (
        comidas.map((m) => {
          const r = recetaById(m.recetaId);
          const f = faltantes(r).length;
          return (
            <View key={m.id} style={styles.bloque}>
              <K.Card
                thumb={r.imagen}
                title={`${m.comida} · ${r.nombre}`}
                sub={f === 0 ? "Completa" : `Falta ${f} insumo${f > 1 ? "s" : ""}`}
                subColor={f === 0 ? colors.green : colors.amber}
                right="Ver"
                onPress={() => go("REC-02", { receta: r.id })}
              />
              <K.LinkText
                label={`Editar ${m.comida} del ${actual[1]}`}
                onPress={() => go("PLA-01", { receta: r.id })}
              />
            </View>
          );
        })
      )}

      <K.Note text="Si cambias tu despensa, el plan se recalcula solo." />
      <K.TextLine
        text={`Cobertura de la semana: ${cob.planificadas} de ${cob.total} comidas planificadas · ${porComprar} insumos por comprar.`}
      />
      <K.LinkText label="Ya cociné este plato · descontar insumos" align="CENTER" onPress={() => go("PRE-01")} />

      <K.SectionTitle title="Próxima semana · 25 nov – 1 dic" />
      <K.EmptyState
        title="Aún no hay platos en esta semana"
        sub="Puedes planificar desde hoy: no hace falta esperar al lunes."
      />
      <Button label="Planificar un plato para esa semana" full onPress={() => go("PLA-01")} />
      <Button label="Generar lista de compras" variant="outline" full onPress={() => go("COM-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ bloque: { gap: 2 } });
