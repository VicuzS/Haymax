import { Pressable, Text, StyleSheet, ActivityIndicator, View } from "react-native";
import { colors, radius, spacing, typography } from "../tokens";
import { focoVisible } from "../lib/a11y";

// Variantes usadas en el prototipo: primary | outline | ghost | danger
// Accesibilidad: rol "button", estado disabled/busy, etiqueta explícita opcional
// (2.5.3 la etiqueta accesible contiene el texto visible) y alto mínimo (no fijo)
// para que el texto pueda crecer con el tamaño de fuente del sistema (1.4.4).
export default function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  full = false,
  compact = false,
  icon,
  accessibilityLabel,
  accessibilityHint,
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={(state) => [
        styles.base,
        compact && styles.compact,
        styles[variant],
        full && styles.full,
        state.pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        focoVisible(state),
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={variant === "primary" ? colors.white : colors.primary} />
        ) : (
          <>
            {icon ? (
              <Text
                style={[styles.icon, styles[variant + "Text"]]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {icon}
              </Text>
            ) : null}
            <Text style={[styles.label, styles[variant + "Text"]]}>{label}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  compact: { paddingHorizontal: spacing.sm },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  full: { alignSelf: "stretch" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
  label: { fontSize: typography.sizes.label, fontWeight: typography.weights.semibold, textAlign: "center" },
  icon: { fontSize: typography.sizes.label },
  primary: { backgroundColor: colors.primary },
  primaryText: { color: colors.white },
  outline: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary },
  outlineText: { color: colors.primary },
  ghost: { backgroundColor: colors.greyBg },
  ghostText: { color: colors.text },
  danger: { backgroundColor: colors.redBg },
  dangerText: { color: colors.red },
});
