import { AccessibilityInfo } from "react-native";
import { colors } from "../tokens";

// Utilidades de accesibilidad (WCAG 2.2) compartidas por todo el kit de UI.

// 2.5.8 (AA, mín. 24 px) y 2.5.5 (AAA / guías Android e iOS, 44-48 px).
export const MIN_TARGET = 44;

// 4.1.3 Mensajes de estado: anuncia un texto a lectores de pantalla sin mover el foco.
export function anunciar(mensaje) {
  if (!mensaje) return;
  try {
    AccessibilityInfo.announceForAccessibility(String(mensaje));
  } catch (_e) {
    // Sin soporte en la plataforma: el mensaje sigue visible en pantalla.
  }
}

// 2.4.7 Foco visible (+ 2.4.11 / 2.4.13 en WCAG 2.2). Pressable informa `focused`
// al navegar con teclado (web) o con lectores/teclado físico; en táctil puro no aplica.
export function focoVisible(state) {
  if (!state || !state.focused) return null;
  return {
    outlineWidth: 3,
    outlineColor: colors.primaryDark,
    outlineStyle: "solid",
    outlineOffset: 2,
  };
}

// Une partes de texto en una sola etiqueta legible ("Título. Subtítulo. Valor").
export function etiqueta(...partes) {
  return partes
    .filter((p) => p !== undefined && p !== null && String(p).trim() !== "")
    .map((p) => String(p).trim())
    .join(". ");
}
