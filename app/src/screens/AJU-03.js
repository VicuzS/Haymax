import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import useApi from "../hooks/useApi";
import { getSesion } from "../lib/api";

export default function AJU_03() {
  const { data: sesion, loading } = useApi(getSesion);
  const nombre = (sesion && (sesion.nombre || sesion.usuario)) || "Mi cuenta";
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <Screen id="AJU-03" name="Integrantes del hogar">
      <K.SectionTitle title="Integrantes del hogar" />
      <View style={styles.rows}>
        <K.Row label={loading ? "…" : nombre} value="Admin" icon={inicial} />
      </View>
      <K.Note text="Fase 2: invitar a más integrantes y compartir la despensa entre celulares." />
      <Button label="Invitar por enlace (próximamente)" variant="outline" full onPress={() => {}} disabled />
      <Button label="Volver a ajustes" full onPress={() => go("AJU-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 0, marginBottom: spacing.xs } });