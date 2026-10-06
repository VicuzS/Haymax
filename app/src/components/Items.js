import { View, StyleSheet, Pressable } from "react-native";
import { go } from "../lib/nav";
import Button from "./Button";
import { stripEmoji, isEmoji } from "./Icon";
import * as K from "./kit";

// Renderiza un item del wireframe (misma forma que prototipo/code.js) con el
// kit de UI. Si el indice tiene destino en `links`, el elemento navega.

const SYMBOLS = ["✓", "!", "★", "✔"];

function isSymbol(s) {
  return typeof s === "string" && s.length <= 2 && (isEmoji(s) || SYMBOLS.indexOf(s) !== -1);
}

// Limpia los emojis decorativos del texto visible (el símbolo de fila y el
// icono se conservan: el kit los convierte en iconos vectoriales).
function prepare(it) {
  const k = it[0];
  const clean = (v) => (typeof v === "string" && !isSymbol(v) ? stripEmoji(v) : v);
  if (k === "row") {
    return [it[0], clean(it[1]), clean(it[2]), it[3], it[4]];
  }
  if (k === "photo" || k === "hero") {
    const src = it[1] || {};
    const out = {};
    Object.keys(src).forEach((key) => {
      out[key] = key === "img" || key === "subColor" ? src[key] : clean(src[key]);
    });
    return [k, out];
  }
  return it.map(clean);
}

function renderOne(it, onPress) {
  const k = it[0];
  switch (k) {
    case "title":
      return <K.TextLine text={it[1]} bold />;
    case "greet":
      return <K.Greet title={it[1]} sub={it[2]} />;
    case "sec":
      return <K.SectionTitle title={it[1]} action={it[2]} onPress={onPress} />;
    case "text":
      return <K.TextLine text={it[1]} color={it[2]} />;
    case "balance":
      return <K.BalanceCard label={it[1]} pct={it[2]} text={it[3]} link={it[4]} />;
    case "banner":
      return <K.Banner title={it[1]} sub={it[2]} tone={it[3]} />;
    case "card":
      return <K.Card title={it[1]} sub={it[2]} subColor={it[3]} right={it[4]} onPress={onPress} />;
    case "row":
      return <K.Row label={it[1]} value={it[2]} valueColor={it[3]} icon={it[4]} onPress={onPress} />;
    case "edit":
      return <K.EditStepper label={it[1]} qty={it[2]} />;
    case "input":
      return <K.InputField placeholder={it[1]} />;
    case "chips":
      return <K.Chips items={it[1]} active={it[2]} />;
    case "chipsok":
      return <K.Chips items={it[1]} ok />;
    case "btn":
      return <Button label={it[1]} variant="primary" full onPress={onPress} />;
    case "btno":
      return <Button label={it[1]} variant="outline" full onPress={onPress} />;
    case "link":
      return <K.LinkText label={it[1]} align={it[2]} onPress={onPress} />;
    case "note":
      return <K.Note text={it[1]} />;
    case "check":
      return <K.CheckCircle title={it[1]} />;
    case "prog":
      return <K.Progress label={it[1]} right={it[2]} pct={it[3]} />;
    case "radio":
      return <K.RadioOption title={it[1]} sub={it[2]} selected={it[3]} />;
    case "stat":
      return <K.Stat value={it[1]} label={it[2]} delta={it[3]} />;
    case "empty":
      return <K.EmptyState title={it[1]} sub={it[2]} />;
    case "photo":
      return <K.PhotoCard {...it[1]} />;
    case "hero":
      return <K.Hero {...it[1]} />;
    case "camera":
      return <K.CameraView />;
    case "logo":
      return <K.Logo tagline={it[1]} />;
    default:
      return null;
  }
}

const FLUSH = ["row", "sec", "greet", "text", "title"];
const SELF_PRESS = ["sec", "card", "row", "link", "btn", "btno"];

export default function Items({ items = [], links = {} }) {
  return (
    <View style={styles.list}>
      {items.map((it, i) => {
        const target = links[i];
        const onPress = target ? () => go(target) : undefined;
        const el = renderOne(prepare(it), onPress);
        if (!el) return null;
        const flush = FLUSH.indexOf(it[0]) !== -1;
        const node =
          onPress && SELF_PRESS.indexOf(it[0]) === -1 ? (
            <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
              {el}
            </Pressable>
          ) : (
            el
          );
        return (
          <View key={i} style={{ marginBottom: flush ? 4 : 12 }}>
            {node}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 0 },
  pressed: { opacity: 0.85 },
});
