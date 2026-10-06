import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import { recetaById } from "../lib/domain";

const DIAS = ["Hoy", "Mañana", "Sábado", "Próx. lunes"];

export default function PLA_01({ receta }) {
  const r = recetaById(receta);
  const [dia, setDia] = useState("Hoy");
  const [porciones, setPorciones] = useState(r.porciones);

  return (
    <Screen id="PLA-01" name="Planificar: paso 1 de 2">
      <K.SectionTitle title="Paso 1 de 2" />
      <K.Card
        thumb={r.imagen}
        title={r.nombre}
        sub={`${r.porciones} porciones · ${r.minutos} min`}
        right="Cambiar"
        onPress={() => go("REC-02", { receta: r.id })}
      />

      <K.SectionTitle title="¿Para cuándo lo planeas?" />
      <K.Chips items={DIAS} active={dia} onPressItem={setDia} />
      <K.TextLine text="La semana completa se edita en tu plan (7 días)." />
      <View style={styles.rows}>
        <K.EditStepper
          label="Porciones"
          qty={porciones}
          onChange={(d) => setPorciones((p) => Math.max(1, Math.min(12, p + d)))}
        />
      </View>
      <K.Note text="Recalcularemos insumos y lista de compras automáticamente." />

      <Button
        label="Confirmar porciones"
        full
        onPress={() => go("PLA-02", { receta: r.id, porciones: String(porciones), dia })}
      />
      <K.LinkText label="Ver resultado con faltantes (demo)" align="CENTER" onPress={() => go("PLA-03", { receta: r.id })} />
      <K.LinkText label="Ver conflicto de horario (demo)" align="CENTER" onPress={() => go("PLA-04")} />
      <K.LinkText label="Cancelar" align="CENTER" onPress={() => go("INI-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
