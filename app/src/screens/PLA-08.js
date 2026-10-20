import { Text, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, typography } from "../tokens";
import { fechaLarga } from "../lib/fechas";

const NOMBRE = "Platillo planificado";

// Post confirmación: check verde, mensaje con el día planificado (o el plato
// actualizado, si vino del reemplazo directo) y los dos botones de salida.
export default function PLA_08({ fecha, comida = "almuerzo", nombre = "", porciones = "1", editado = false }) {
  const comidaBonita = comida.charAt(0).toUpperCase() + comida.slice(1);
  return (
    <Screen id="PLA-08" name={editado ? "Platillo actualizado" : NOMBRE}>
      <K.CheckCircle title="¡Listo!" />
      <Text style={styles.mensaje}>
        {editado ? "Su platillo ha sido actualizado" : "Su platillo ha sido planificado"} para el día{" "}
        <Text style={styles.dia}>{fecha ? fechaLarga(fecha) : "—"}</Text>
      </Text>
      <K.TextLine text={`${comidaBonita} · ${nombre || "Platillo"} · ${porciones} porciones`} />
      <K.Note text="Guardamos la fecha, la comida y las porciones en tu plan. Podrás cambiarlo cuando quieras." />

      <Button label="Volver al menú principal" full onPress={() => go("INI-01")} />
      <Button label="Ver mi plan de la semana" variant="outline" full onPress={() => go("PLA-09", { fecha })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  mensaje: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    color: colors.green,
    textAlign: "center",
    lineHeight: 24,
  },
  dia: { color: colors.green, textDecorationLine: "underline" },
});
