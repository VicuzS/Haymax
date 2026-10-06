import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, spacing } from "../tokens";

const SUGERIDAS = ["arroz", "mariscos", "huevos"];
const TIPOS = ["Pesados", "Picantes"];

export default function AJU_02() {
  const [activas, setActivas] = useState(["arroz", "mariscos"]);
  const [excluidos, setExcluidos] = useState(["Pesados", "Picantes"]);

  const agregar = (x) => setActivas((a) => (a.includes(x) ? a : [...a, x]));
  const quitar = (x) => setActivas((a) => a.filter((i) => i !== x));
  const alternarTipo = (t) =>
    setExcluidos((e) => (e.includes(t) ? e.filter((i) => i !== t) : [...e, t]));

  return (
    <Screen id="AJU-02" name="Exclusiones alimentarias">
      <K.SectionTitle title="Ingredientes que no quiero" />
      <K.Chips items={SUGERIDAS} active={SUGERIDAS.find((s) => !activas.includes(s))} onPressItem={agregar} />
      <K.Chips items={activas.map((a) => ({ label: a }))} ok onPressItem={quitar} />

      <K.SectionTitle title="Tipos de plato" />
      <View style={styles.rows}>
        {TIPOS.map((t) => {
          const fuera = excluidos.includes(t);
          return (
            <K.Row
              key={t}
              label={t}
              value={fuera ? "Excluir" : "Incluir"}
              valueColor={fuera ? colors.amber : colors.green}
              icon={fuera ? "!" : "✓"}
              onPress={() => alternarTipo(t)}
            />
          );
        })}
      </View>

      <K.Note text="Se aplican al motor, al planificador y a la lista de compras." />
      <Button label="Guardar" full onPress={() => go("AJU-01")} />
      <K.LinkText label="Ver recetas que se verán afectadas" onPress={() => go("REC-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 0, marginBottom: spacing.xs } });
