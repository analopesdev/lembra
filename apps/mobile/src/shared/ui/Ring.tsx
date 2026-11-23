import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "./useTheme";

type Props = {
  value: number;
  size?: number;
  stroke?: number;
  accessibilityLabel: string;
  children?: React.ReactNode;
};

/** Anel de memória: trilho `heroTrack`, arco `accent`; o conteúdo (número + legenda) vai no centro. */
export function Ring({ value, size = 112, stroke = 10, accessibilityLabel, children }: Props) {
  const t = useTheme();
  const v = Math.min(1, Math.max(0, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} style={styles.svg}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.heroTrack} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={t.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c * v} ${c}`}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: { position: "absolute" },
  center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
});
