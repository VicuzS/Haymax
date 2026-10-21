// Tokens de diseño — única fuente de verdad de los valores visuales.
// Extraídos del prototipo Figma (motor Stitch) · pantalla base 375x812.
export const colors = {
  primary: "#8B4A2A",
  primaryDark: "#6E3A20",
  primaryLight: "#F4E7DE",
  text: "#1F1F1F",
  sub: "#5C5C5C",
  muted: "#666666",
  green: "#2E7D32",
  greenBg: "#E7F6EC",
  green2: "#43A047",
  amber: "#8F5400",
  amberBg: "#FFF8E1",
  red: "#C62828",
  redBg: "#FDECEA",
  border: "#E6E6E6",
  field: "#F7F7F7",
  track: "#EEEEEE",
  greyBg: "#F5F5F5",
  canvas: "#F8F9FA",
  white: "#FFFFFF",
  dark: "#2B2B2B",
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const typography = {
  sizes: { caption: 12, small: 12, body: 13, label: 15, subtitle: 16, title: 22, hero: 34 },
  lineHeights: { tight: 1.15, normal: 1.35 },
  weights: { regular: "400", medium: "500", semibold: "600", bold: "700" },
};

export const layout = {
  screenW: 375,
  screenH: 812,
  padding: 16,
  contentTop: 104,
  tabBarY: 748,
};

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  fab: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
};

export default { colors, spacing, radius, typography, layout, shadows };
