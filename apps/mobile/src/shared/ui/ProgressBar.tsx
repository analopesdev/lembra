import { StyleSheet, View } from "react-native";

import { radius } from "./theme";
import { useTheme, type Colors } from "./useTheme";

type Props = {
  value: number;
  fill?: keyof Colors | string;
  track?: keyof Colors;
  accessibilityLabel: string;
};

/** Barra de progresso de 6 px; `value` de 0 a 1 (fora disso é limitado). */
export function ProgressBar({ value, fill = "button", track = "surface", accessibilityLabel }: Props) {
  const t = useTheme();
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      style={[styles.track, { backgroundColor: t[track] }]}
    >
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: t[fill as keyof Colors] ?? fill }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: radius.pill, overflow: "hidden" },
  fill: { height: 6, borderRadius: radius.pill },
});
