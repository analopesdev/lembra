import Svg, { Circle, Path } from "react-native-svg";

import { useTheme } from "./useTheme";

type Props = { width?: number };

export function LogoMark({ width = 40 }: Props) {
  const t = useTheme();
  return (
    <Svg width={width} height={width * 0.75} viewBox="0 0 120 90" fill="none">
      <Path
        d="M8 18 C14 52 20 66 28 72 L28 18 C38 42 48 52 60 56 L60 18 C74 30 88 34 102 36 L102 18 L110 18"
        stroke={t.link}
        strokeWidth={11}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={112} cy={18} r={9} fill={t.button} />
    </Svg>
  );
}
