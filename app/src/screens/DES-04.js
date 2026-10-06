import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import * as K from "../components/kit";
import { go } from "../lib/nav";

export default function DES_04() {
  const [modo, setModo] = useState("Boleta");
  const capturar = () => go("DES-05");

  return (
    <Screen id="DES-04" name="Escanear con la cámara (mock)">
      <K.Chips items={["Boleta", "Lista de compras"]} active={modo} onPressItem={setModo} />
      <Pressable onPress={capturar} style={({ pressed }) => pressed && styles.down}>
        <K.CameraView
          modo={modo}
          hint={
            modo === "Boleta"
              ? "Encuadra la boleta completa con buena luz"
              : "Encuadra la lista completa con buena luz"
          }
        />
      </Pressable>
      <K.LinkText
        label="También puedes usar una foto de la galería."
        onPress={capturar}
      />
      <K.Note text="Consejos: buena luz, plano completo y sin sombras." />
      <K.LinkText label="Elegir otro tipo de documento" onPress={() => go("DES-03")} />
    </Screen>
  );
}

const styles = StyleSheet.create({ down: { opacity: 0.7 } });
