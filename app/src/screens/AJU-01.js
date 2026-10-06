import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { spacing, colors } from "../tokens";
import { leerSesion, borrarSesion } from "../lib/sesion";

export default function AJU_01() {
  const [sesion, setSesion] = useState(null);
  const [notif, setNotif] = useState(true);

  useEffect(() => {
    let vivo = true;
    leerSesion().then((s) => {
      if (vivo) setSesion(s);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const cerrar = async () => {
    await borrarSesion();
    go("ACC-02");
  };

  const perfil = sesion && sesion.modo === "invitado" ? "Invitado" : "Admin";

  return (
    <Screen id="AJU-01" name="Ajustes">
      <View style={styles.rows}>
        <K.Row label={(sesion && sesion.usuario) || "Rosa Ticlla"} value={perfil} icon="R" onPress={() => go("AJU-03")} />
        <K.Row label="Mi distrito" value="Surquillo" icon="📍" onPress={() => go("ACC-04")} />
        <K.Row
          label="Notificaciones"
          value={notif ? "Activadas" : "Desactivadas"}
          valueColor={notif ? undefined : colors.muted}
          icon="🔔"
          onPress={() => setNotif((v) => !v)}
        />
        <K.Row label="Exclusiones" value="2 activas" icon="🚫" onPress={() => go("AJU-02")} />
        <K.Row label="Integrantes del hogar" value="2" icon="👪" onPress={() => go("AJU-03")} />
        <K.Row label="Plan de suscripción" value="Gratis" icon="★" onPress={() => go("AJU-04")} />
      </View>
      <Button label="Cerrar sesión" variant="outline" full onPress={cerrar} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 0, marginBottom: spacing.sm } });
