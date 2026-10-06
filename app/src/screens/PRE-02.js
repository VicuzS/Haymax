import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import { ajustarDespensa } from "../data/mock";

const BASE = [
  { id: "D1", label: "Lomo fino de res", qty: 500, base: 500, unit: "g" },
  { id: "D2", label: "Cebolla roja", qty: 2, base: 2, unit: "unid" },
  { id: "D3", label: "Tomate italiano", qty: 2, base: 2, unit: "unid" },
  { id: "D4", label: "Papa amarilla", qty: 500, base: 500, unit: "g" },
];

const PASO = (unit) => (unit === "g" ? 50 : 1);

export default function PRE_02() {
  const [filas, setFilas] = useState(BASE);

  const cambiar = (id, d) =>
    setFilas((fs) =>
      fs.map((f) => (f.id === id ? { ...f, qty: Math.max(0, f.qty + d * PASO(f.unit)) } : f))
    );

  const confirmar = () => {
    ajustarDespensa(filas);
    go("DES-01");
  };

  return (
    <Screen id="PRE-02" name="Despensa actualizada (cantidades)">
      <K.CheckCircle title="Despensa actualizada" />
      <K.SectionTitle title="Insumos descontados" />
      <View style={styles.rows}>
        {filas.map((f) => (
          <K.EditStepper
            key={f.id}
            label={f.label}
            qty={`${f.qty} ${f.unit}`}
            onChange={(d) => cambiar(f.id, d)}
          />
        ))}
      </View>
      <K.Note text="¿Usaste otra cantidad? Ajústala con − / + antes de salir." />
      <Button label="Confirmar cantidades" full onPress={confirmar} />
      <Button label="Ver resumen de salud" variant="outline" full onPress={() => go("SAL-01")} />
      <K.LinkText label="Volver a mi inicio" align="CENTER" onPress={() => go("INI-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
