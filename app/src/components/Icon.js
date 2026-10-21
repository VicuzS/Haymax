import { Ionicons } from "@expo/vector-icons";
import { colors } from "../tokens";

// Iconografia profesional del app: sustituye los emojis del wireframe por
// iconos vectoriales. Los símbolos del inventario se mapean a Ionicons.

const MAP = {
  "📷": "camera-outline",
  "🔔": "notifications-outline",
  "📍": "location-outline",
  "👥": "people-outline",
  "⏱": "time-outline",
  "⏰": "alarm-outline",
  "★": "star",
  "☆": "star-outline",
  "✓": "checkmark",
  "✔": "checkmark",
  "⚠": "warning-outline",
  "❗": "alert-circle-outline",
  "!": "alert-circle-outline",
  "●": "ellipse",
  "🍽": "restaurant-outline",
  "🍴": "restaurant-outline",
  "🥩": "restaurant-outline",
  "🍲": "restaurant-outline",
  "🥗": "restaurant-outline",
  "🍗": "restaurant-outline",
  "🍎": "restaurant-outline",
  "🏠": "home-outline",
  "🧺": "basket-outline",
  "📅": "calendar-outline",
  "⚙": "settings-outline",
  "⚙️": "settings-outline",
  "💡": "bulb-outline",
  "📦": "cube-outline",
  "💸": "cash-outline",
  "🌱": "leaf-outline",
};

// Rangos de emoji/símbolos decorativos que NO queremos en el texto visible
// (la flecha → se conserva porque es navegación, no decoración).
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0E}\u{FE0F}\u{231A}\u{231B}\u{23F1}\u{23F2}]/gu;

export function isEmoji(s) {
  if (typeof s !== "string") return false;
  EMOJI_RE.lastIndex = 0;
  return EMOJI_RE.test(s);
}

export function stripEmoji(s) {
  if (typeof s !== "string") return s;
  EMOJI_RE.lastIndex = 0;
  return s.replace(EMOJI_RE, "").replace(/\s+/g, " ").trim();
}

// Resuelve el símbolo del wireframe (emoji, letra inicial o icono directo).
export function resolveIconName(char) {
  if (!char || typeof char !== "string") return null;
  if (MAP[char]) return MAP[char];
  if (isEmoji(char)) return "ellipse"; // emoji sin mapear: punto neutro
  return null;
}

// 1.1.1 Contenido no textual: el icono es decorativo (oculto a lectores de pantalla)
// salvo que se pase `accessibilityLabel`, en cuyo caso se expone como imagen con texto alternativo.
export default function Icon({ name, size = 16, color = colors.text, style, accessibilityLabel }) {
  const ion = MAP[name] || name;
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityRole: "image", accessibilityLabel }
    : { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" };
  return <Ionicons name={ion} size={size} color={color} style={style} {...a11y} />;
}
