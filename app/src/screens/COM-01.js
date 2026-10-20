import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, spacing } from "../tokens";
import useApi from "../hooks/useApi";
import {
  getCompras,
  setCompraListo,
  crearItemCompra,
  quitarCompra,
  quitarComprados,
  generarListaCompras,
} from "../lib/api";

const NOMBRE = "Lista de compras";
// Orden preferido de secciones; las demás se agregan al final.
const PRINCIPALES = ["Mercado de abastos", "Supermercado"];

export default function COM_01() {
  const { data, loading, error, recargar } = useApi(getCompras);
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");

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

  const secciones = [
    ...PRINCIPALES.filter((sec) => items.some((i) => i.seccion === sec)),
    ...Array.from(new Set(items.map((i) => i.seccion).filter((sec) => PRINCIPALES.indexOf(sec) === -1))),
  ];

  const conError = (e) => setAviso((e && e.message) || "Algo salió mal. Revisa tu conexión con la API.");

  const toggle = async (it) => {
    if (ocupado) return;
    setOcupado(true);
    try {
      await setCompraListo(it.id, !it.listo);
      setAviso("");
      recargar({ silencioso: true });
    } catch (e) {
      conError(e);
    } finally {
      setOcupado(false);
    }
  };

  const agregar = async () => {
    if (ocupado) return;
    setOcupado(true);
    try {
      await crearItemCompra({ nombre, cantidad });
      setNombre("");
      setCantidad("");
      setAviso("");
      recargar({ silencioso: true });
    } catch (e) {
      conError(e);
    } finally {
      setOcupado(false);
    }
  };

  const limpiarComprados = async () => {
    if (ocupado) return;
    setOcupado(true);
    try {
      await quitarComprados();
      setAviso("");
      recargar({ silencioso: true });
    } catch (e) {
      conError(e);
    } finally {
      setOcupado(false);
    }
  };

  const generar = async () => {
    if (ocupado) return;
    setOcupado(true);
    try {
      await generarListaCompras();
      setAviso("");
      recargar({ silencioso: true });
    } catch (e) {
      conError(e);
    } finally {
      setOcupado(false);
    }
  };

  const quitarUno = async (it) => {
    if (ocupado) return;
    setOcupado(true);
    try {
      await quitarCompra(it.id);
      setAviso("");
      recargar({ silencioso: true });
    } catch (e) {
      conError(e);
    } finally {
      setOcupado(false);
    }
  };

  const valorDe = (it) => {
    const cant = it.cantidad != null ? String(it.cantidad) : "";
    return it.unidad_medida ? `${cant} ${it.unidad_medida}` : cant;
  };

  return (
    <Screen id="COM-01" name={NOMBRE}>
      <K.Progress label="Tu lista de compras" right={`${prog.listos} de ${prog.total} ítems`} pct={prog.pct} />

      {prog.listos > 0 ? (
        <K.Note
          text={`${prog.listos} ítems ya están marcados como comprados.`}
          onPress={limpiarComprados}
        />
      ) : null}

      <K.SectionTitle title="¿Te falta algo?" />
      <K.InputField placeholder="Ítem (p. ej. Salsa de soya)" value={nombre} onChangeText={setNombre} />
      <View style={styles.filaQty}>
        <View style={styles.campoQty}>
          <K.InputField
            placeholder="Cantidad (p. ej. 2 kg)"
            value={cantidad}
            onChangeText={setCantidad}
          />
        </View>
        <View style={styles.botonQty}>
          <Button label="Agregar" full onPress={agregar} />
        </View>
      </View>

      {secciones.map((sec) => {
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
                  value={valorDe(it)}
                  valueColor={it.listo ? colors.green : colors.text}
                  icon={it.listo ? "✓" : undefined}
                  onPress={() => toggle(it)}
                />
              ))}
            </View>
            {grupo
              .filter((it) => it.listo)
              .map((it) => (
                <K.LinkText key={"q" + it.id} label={`Quitar ${it.nombre}`} onPress={() => quitarUno(it)} />
              ))}
          </View>
        );
      })}

      <Button label="Generar desde mi plan de la semana" full onPress={generar} />
      <Button label="Registrar compra escaneada" variant="outline" full onPress={() => go("DES-04")} />
      <Button label="Repasar mi despensa" variant="outline" full onPress={() => go("DES-01")} />
      {aviso ? <K.Banner title={aviso} tone="RED" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: 0 },
  rows: { gap: 0 },
  filaQty: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  campoQty: { flex: 1 },
  botonQty: { flex: 1 },
});
