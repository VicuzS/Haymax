import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing } from "../tokens";
import { guardarSesion } from "../lib/api";

const DISTRITOS = ["Surquillo", "Miraflores", "Lima Norte"];

export default function ACC_04() {
  const [q, setQ] = useState("");
  const [distrito, setDistrito] = useState("Surquillo");

  const empezar = async () => {
    await guardarSesion({ modo: "invitado", distrito });
    go("INI-02");
  };

  return (
    <Screen id="ACC-04" name="Onboarding: distrito e integrantes">
      <K.SectionTitle title="¿Dónde vives?" />
      <K.InputField placeholder="Busca tu distrito…" value={q} onChangeText={setQ} />
      <View style={styles.rows}>
        {DISTRITOS.filter((d) => d.toLowerCase().includes(q.trim().toLowerCase())).map((d) => (
          <K.Row
            key={d}
            label={d}
            value={distrito === d ? "✓" : ""}
            icon="📍"
            onPress={() => setDistrito(d)}
          />
        ))}
      </View>

      <K.SectionTitle title="¿Quién cocina en casa?" />
      <View style={styles.rows}>
        <K.Row label="Rosa Ticlla" value="Admin" icon="R" />
        <K.Row label="Diego Lopez" value="Miembro" valueColor="#9E9E9E" icon="D" />
      </View>
      <Button label="+ Agregar integrante" variant="outline" full onPress={() => go("AJU-03")} />

      <Button label="Empezar" full onPress={empezar} />
      <K.LinkText label="¿Ya tienes cuenta? Inicia sesión" onPress={() => go("ACC-02")} />
      <K.LinkText label="Ya usé Haymax antes · ir a mi inicio" onPress={() => go("INI-01")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 0, marginBottom: spacing.xs } });
