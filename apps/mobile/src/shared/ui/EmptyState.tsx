import { StyleSheet, Text, View } from "react-native";

import { fonts, radius, space, type } from "./theme";
import { useTheme } from "./useTheme";

type Props = { title: string; description: string };

/** Estado vazio genérico; não conhece domínio (recebe dados prontos). Cores só pelos tokens. */
export function EmptyState({ title, description }: Props) {
  const t = useTheme();
  return (
    <View accessibilityRole="summary" style={[styles.box, { backgroundColor: t.background }]}>
      <Text
        accessibilityRole="header"
        style={{
          color: t.text,
          fontFamily: fonts.text.extrabold,
          fontSize: type.titulo.size,
          lineHeight: type.titulo.size * type.titulo.lineHeight,
          letterSpacing: type.titulo.size * type.titulo.letterSpacing,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: t.textMuted,
          fontFamily: fonts.text.regular,
          fontSize: type.corpo.size,
          lineHeight: type.corpo.size * type.corpo.lineHeight,
          marginTop: space.sm,
          textAlign: "center",
          borderRadius: radius.sm,
        }}
      >
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: "center", justifyContent: "center", padding: space["2xl"] },
});
