import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import useApi from "../hooks/useApi";
import { getCompras, setCompraListo } from "../lib/api";

const NOMBRE = "Lista de compras";
const SECCIONES = ["Supermercado", "Mercado de abastos"];

export default function COM_01() {
  const { data, loading, error, recargar } = useApi(getCompras);

  if (loading) {
    return (
      <Screen id="COM-01" name={NOMBRE}>
        <K.Loading text="Cargando tu lista…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen id="COM-01" name={NOMBRE}>
        <K.ErrorState onRetry={recargar} />
      </Screen>
    );
  }

  const { items, prog } = data;

  const toggle = async (id) => {
    await setCompraListo(id);
    recargar({ silencioso: true });
  };

  return (
    <Screen id="COM-01" name={NOMBRE}>
      <K.Progress label="Tu lista de compras" right={`${prog.listos} de ${prog.total} ítems`} pct={prog.pct} />

      {SECCIONES.map((sec) => {
        const grupo = items.filter((i) => i.seccion === sec);
        if (grupo.length === 0) return null;
        return (
          <View key={sec} style={styles.grupo}>
            <K.SectionTitle title={sec} />
            <View style={styles.rows}>
              {grupo.map((it) => (
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
