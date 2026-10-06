import { useState } from "react";
import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";

export default function PLA_04() {
  const [opcion, setOpcion] = useState(0);

  return (
    <Screen id="PLA-04" name="Planificar: conflicto de horario">
      <K.Banner
        title="Ya tienes Lomo Saltado el martes a las 13:00"
        sub="Elige qué hacer con el plato nuevo"
        tone="PRIMARY"
      />
      <K.RadioOption
        title="Quitar el plato anterior"
        sub="Solo quedará el plato nuevo el martes"
        selected={opcion === 0}
        onPress={() => setOpcion(0)}
      />
      <K.RadioOption
        title="Dejar los dos platos"
        sub="Habrá dos platos a la misma hora"
        selected={opcion === 1}
        onPress={() => setOpcion(1)}
      />
      <K.Note text="Ambas opciones mantienen tus porciones y tu lista." />
      <Button label="Confirmar" full onPress={() => go("PLA-05")} />
      <K.LinkText label="Cancelar (demo)" align="CENTER" onPress={() => go("PLA-01")} />
    </Screen>
  );
}
