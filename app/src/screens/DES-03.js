import { View, Text, Pressable, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Icon from "../components/Icon";
import * as K from "../components/kit";
import { go } from "../lib/nav";
import { colors, spacing, typography, shadows, radius } from "../tokens";
import { focoVisible } from "../lib/a11y";

const OPCIONES = [
  {
    id: "boleta",
    icon: "camera-outline",
    title: "Escanear boleta",
    sub: "Foto de la boleta del supermercado. Reconocemos productos, cantidades y precios.",
    target: "DES-04",
  },
  {
    id: "lista",
    icon: "list-outline",
    title: "Escanear lista de compras",
    sub: "Foto de tu lista manuscrita o impresa. Reconocemos los productos.",
    target: "DES-04",
  },
  {
    id: "manual",
    icon: "create-outline",
    title: "Agregar manualmente",
    sub: "Escribe producto, cantidad y unidad. Ideal para mercado o bodega.",
    target: "DES-06",
  },
];

export default function DES_03() {
  return (
    <Screen id="DES-03" name="Agregar insumos">
      <K.SectionTitle title="¿Cómo quieres agregar insumos?" />
      <Text style={styles.hint}>
        Elige la opción que mejor se adapte a tu compra. Puedes cambiarla después.
      </Text>

      {OPCIONES.map((op) => (
        <Pressable
          key={op.id}
          onPress={() => go(op.target)}
          accessibilityRole="button"
          accessibilityLabel={op.title}
          accessibilityHint={op.sub}
          style={(state) => [
            styles.card,
            state.pressed && styles.pressed,
            focoVisible(state),
          ]}
        >
          <View style={styles.iconBox}>
            <Icon name={op.icon} size={26} color={colors.primary} />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.title}>{op.title}</Text>
            <Text style={styles.sub}>{op.sub}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
      ))}

      <K.TextLine text="Consejo: si compras en el mercado, elige «Agregar manualmente»; si te dieron boleta, usa «Escanear boleta»." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: typography.sizes.body,
    color: colors.sub,
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  pressed: { opacity: 0.85 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  textBox: { flex: 1, gap: 2 },
  title: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  sub: {
    fontSize: typography.sizes.body,
    color: colors.sub,
    lineHeight: 18,
  },
});