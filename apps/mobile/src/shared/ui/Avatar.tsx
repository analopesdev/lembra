import { Avatar as DiceAvatar, Style } from "@dicebear/core";
import cameo from "@dicebear/styles/cameo.json";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { useTheme } from "./useTheme";

const style = new Style(cameo);

export const FALLBACK_SEED = "lembra";

export function avatarSvg(seed: string): string {
  return new DiceAvatar(style, { seed: seed === "" ? FALLBACK_SEED : seed }).toString();
}

type Props = { seed: string; size: number };

export function Avatar({ seed, size }: Props) {
  const t = useTheme();
  const xml = useMemo(() => avatarSvg(seed), [seed]);
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: t.tint, borderColor: t.border },
      ]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, overflow: "hidden" },
});
