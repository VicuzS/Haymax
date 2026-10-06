import { Pressable, Text, StyleSheet, ActivityIndicator, View } from "react-native";
import { colors, radius, spacing, typography } from "../tokens";

// Variantes usadas en el prototipo: primary | outline | ghost | danger
export default function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  full = false,
  icon,
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        full && styles.full,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={variant === "primary" ? colors.white : colors.primary} />
        ) : (
          <>
            {icon ? <Text style={[styles.icon, styles[variant + "Text"]]}>{icon}</Text> : null}
            <Text style={[styles.label, styles[variant + "Text"]]}>{label}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  full: { alignSelf: "stretch" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
  label: { fontSize: typography.sizes.label, fontWeight: typography.weights.semibold },
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
