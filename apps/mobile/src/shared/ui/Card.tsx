import { StyleSheet, View, type ViewProps } from "react-native";

import { radius, space } from "./theme";
import { useTheme } from "./useTheme";

type Props = ViewProps & { tone?: "surface" | "tint" | "soft"; padded?: boolean };

/** Cartão: fundo por cor, borda de 1 px, sem sombra (DESIGN.md). */
export function Card({ tone = "surface", padded = true, style, ...rest }: Props) {
  const t = useTheme();
  const bg = tone === "tint" ? t.tint : tone === "soft" ? t.surfaceMuted : t.surface;
  return (
    <View
      {...rest}
      style={[
        styles.card,
        { backgroundColor: bg, borderColor: tone === "tint" ? "transparent" : t.border },
        padded && styles.padded,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1 },
  padded: { padding: space.lg },
});
