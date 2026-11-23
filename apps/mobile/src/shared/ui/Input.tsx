import { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { fonts, radius, space } from "./theme";
import { Text } from "./Text";
import { useTheme } from "./useTheme";

type Props = Omit<TextInputProps, "style"> & {
  label: string;
  hint?: string;
  error?: string;
  trailing?: React.ReactNode;
  minLines?: number;
};

const LINE_HEIGHT = 22;

export function Input({ label, hint, error, trailing, minLines, onFocus, onBlur, ...rest }: Props) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const multiline = minLines !== undefined && minLines > 1;
  const border = error ? t.danger : focused ? t.button : t.border;
  return (
    <View style={styles.wrap}>
      <Text variant="label">{label}</Text>
      <View
        style={[
          styles.field,
          multiline
            ? { minHeight: minLines * LINE_HEIGHT + 28, alignItems: "flex-start", paddingVertical: 14 }
            : { height: 52 },
          { backgroundColor: t.surface, borderColor: border, borderWidth: focused || error ? 2 : 1 },
        ]}
      >
        <TextInput
          {...rest}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
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
          style={[styles.input, multiline && styles.multi, { color: t.text }]}
        />
        {trailing}
      </View>
      {error ? (
        <Text variant="legenda" tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
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
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.text.regular, fontSize: 15, padding: 0 },
  multi: { lineHeight: LINE_HEIGHT, alignSelf: "stretch" },
});
