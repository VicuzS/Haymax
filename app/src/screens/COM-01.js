import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { shoppingMock } from "../data/mock";
import { shoppingProgress } from "../lib/domain";

const SECCIONES = ["Supermercado", "Mercado de abastos"];

export default function COM_01() {
  const [, force] = useState(0);
  const prog = shoppingProgress();

  const toggle = (id) => {
    const i = shoppingMock.findIndex((x) => x.id === id);
    if (i >= 0) {
      shoppingMock.splice(i, 1, { ...shoppingMock[i], listo: !shoppingMock[i].listo });
    }
    force((n) => n + 1);
  };

  return (
    <Screen id="COM-01" name="Lista de compras">
      <K.Progress label="Tu lista de compras" right={`${prog.listos} de ${prog.total} ítems`} pct={prog.pct} />

      {SECCIONES.map((sec) => {
        const items = shoppingMock.filter((i) => i.seccion === sec);
        if (items.length === 0) return null;
        return (
          <View key={sec} style={styles.grupo}>
            <K.SectionTitle title={sec} />
            <View style={styles.rows}>
              {items.map((it) => (
                <K.Row
                  key={it.id}
                  label={it.nombre}
                  value={it.cantidad}
                  icon={it.listo ? "✓" : undefined}
                  onPress={() => toggle(it.id)}
                />
              ))}
            </View>
          </View>
        );
      })}

      <Button label="Agregar ítem manual" variant="outline" full onPress={() => go("DES-03")} />
      <Button label="Registrar compra escaneada" full onPress={() => go("DES-04")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ grupo: { gap: 0 }, rows: { gap: 0 } });
