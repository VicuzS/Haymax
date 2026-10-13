import Screen from "../components/Screen";
import Button from "../components/Button";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors } from "../tokens";
import { scanMock } from "../data/mock";
import { agregarUltimos } from "../lib/api";

export default function DES_05() {
  const leidos = scanMock.filter((s) => !s.revisar).length;
  const revisar = scanMock.length - leidos;

  const confirmar = async () => {
    await agregarUltimos(
      scanMock.map((s, i) => ({
        id: "L" + (i + 1),
        nombre: s.nombre,
        cantidad: s.revisar ? "1 und" : s.precio.replace("S/ ", "· S/ "),
      }))
    );
    go("DES-08");
  };

  return (
    <Screen id="DES-05" name="Revisión del escaneo">
      <K.SectionTitle title="Boleta · Wong · 18/nov" action="Revisar" />
      <K.Chips items={[`${leidos} leídos`, `${revisar} por revisar`]} ok />

      {scanMock.map((s) => (
        <K.Row
          key={s.id}
          label={s.nombre}
          value={s.precio}
          valueColor={s.revisar ? colors.amber : undefined}
          icon={s.revisar ? "!" : undefined}
        />
      ))}

      <K.Note text="Las filas marcadas con ? no se reconocieron: edítalas antes de guardar." />
      <Button label="Confirmar y guardar" full onPress={confirmar} />
      <Button label="Registrar manualmente" variant="outline" full onPress={() => go("DES-06")} />
      <K.LinkText label="Repetir escaneo" align="CENTER" onPress={() => go("DES-04")} />
      <K.TextLine text={`Se agregarán ${scanMock.length} productos a tu despensa.`} />
    </Screen>
  );
}
