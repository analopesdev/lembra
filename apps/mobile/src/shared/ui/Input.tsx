import { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { fonts, radius, space } from "./theme";
import { Text } from "./Text";
import { useTheme } from "./useTheme";

type Props = Omit<TextInputProps, "style"> & { label: string; hint?: string; trailing?: React.ReactNode };

/** Campo: rótulo acima, 52 px, cantos 16, borda de 2 px azul aço em foco. */
export function Input({ label, hint, trailing, onFocus, onBlur, ...rest }: Props) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text variant="label">{label}</Text>
      <View
        style={[
          styles.field,
          {
            backgroundColor: t.surface,
            borderColor: focused ? t.button : t.border,
            borderWidth: focused ? 2 : 1,
          },
        ]}
      >
        <TextInput
          {...rest}
          accessibilityLabel={label}
          placeholderTextColor={t.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: t.text }]}
        />
        {trailing}
      </View>
      {hint ? (
        <Text variant="legenda" tone="textMuted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  field: {
    height: 52,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.text.regular, fontSize: 15, padding: 0 },
});
