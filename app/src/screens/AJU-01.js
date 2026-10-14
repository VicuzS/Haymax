import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go, replaceTo } from "../lib/nav";
import { spacing, colors } from "../tokens";
import useApi from "../hooks/useApi";
import { getSesion, cerrarSesion } from "../lib/api";

const NOMBRE = "Ajustes";

export default function AJU_01() {
  const { data: sesion, loading } = useApi(getSesion);
  const [notif, setNotif] = useState(true);
  const [cerrando, setCerrando] = useState(false);

  const cerrar = async () => {
    if (cerrando) return;
    setCerrando(true);
    try {
      await cerrarSesion();
    } finally {
      // Reemplaza la ruta, no la apila: Atrás no debe regresar a la sesión cerrada.
      replaceTo("ACC-02");
    }
  };

  const usuario = (sesion && (sesion.nombre || sesion.usuario)) || "Mi cuenta";
  const distrito = (sesion && sesion.distrito) || "Sin configurar";

  return (
    <Screen id="AJU-01" name={NOMBRE}>
      <View style={styles.rows}>
        <K.Row label={loading ? "Cargando perfil…" : usuario} value="Mi perfil" icon="R" onPress={() => go("ACC-04")} />
        <K.Row label="Mi distrito" value={distrito} icon="📍" onPress={() => go("ACC-04")} />
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
      <Button label={cerrando ? "Cerrando sesión…" : "Cerrar sesión"} variant="outline" full onPress={cerrar} disabled={cerrando} />
    </Screen>
  );
}

const styles = StyleSheet.create({ rows: { gap: 0, marginBottom: spacing.sm } });
