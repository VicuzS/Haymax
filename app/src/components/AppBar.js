import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../tokens";

// Cabecera de las pantallas (equivale al AppBar del prototipo Figma).
export default function AppBar({ title, crumb, onBack, right }) {
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={styles.back}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
        ) : null}
        <View>
          {crumb ? <Text style={styles.crumb}>{crumb}</Text> : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
      {right ? <View style={styles.side}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  side: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  back: { marginRight: spacing.xs },
  backText: { fontSize: 22, color: colors.primary },
  crumb: { fontSize: typography.sizes.caption, color: colors.muted, letterSpacing: 0.7 },
  title: { fontSize: typography.sizes.subtitle, fontWeight: typography.weights.semibold, color: colors.text },
});
