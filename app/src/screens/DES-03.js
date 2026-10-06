import Screen from "../components/Screen";
import * as K from "../components/kit";
import { go } from "../lib/nav";

export default function DES_03() {
  return (
    <Screen id="DES-03" name="¿Cómo agregar insumos? (3 opciones)">
      <K.SectionTitle title="¿Cómo quieres agregar insumos?" />
      <K.Card title="Escanear boleta" sub="Foto de la boleta del mercado" right="→" onPress={() => go("DES-04")} />
      <K.Card title="Escanear lista de compras" sub="Reconocemos los productos de la lista" right="→" onPress={() => go("DES-04")} />
      <K.Card title="Agregar manualmente" sub="Escribe producto, cantidad y unidad" right="→" onPress={() => go("DES-06")} />
      <K.TextLine text="Tres formas según lo que tengas a mano: boleta, lista o a mano." />
    </Screen>
  );
}
