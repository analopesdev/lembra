import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { radius, space } from "./theme";
import { Text } from "./Text";
import { useTheme } from "./useTheme";

type Props = {
  label: string;
  onPress?: () => void;
  /** primary = azul aço com texto escuro; secondary = contorno; ghost = só texto. */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  leading?: React.ReactNode;
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  leading,
  accessibilityLabel,
}: Props) {
  const t = useTheme();
  const inactive = disabled || loading;
  const bg = variant === "primary" ? t.button : variant === "danger" ? t.danger : "transparent";
  const border = variant === "secondary" ? t.border : "transparent";
  const tone =
    variant === "primary"
      ? "onButton"
      : variant === "danger"
        ? "onDanger"
        : variant === "ghost"
          ? "link"
          : "text";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor: border, opacity: inactive ? 0.5 : pressed ? 0.85 : 1 },
        variant === "ghost" && styles.ghost,
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={t.onButton} /> : leading}
        <Text variant="subtitulo" tone={tone}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: 17,
    paddingHorizontal: space.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  ghost: { paddingVertical: space.md },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
});
