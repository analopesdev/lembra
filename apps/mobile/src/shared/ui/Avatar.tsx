import { createAvatar } from "@dicebear/core";
import * as lorelei from "@dicebear/lorelei";
import * as notionists from "@dicebear/notionists";
import * as openPeeps from "@dicebear/open-peeps";
import * as shapes from "@dicebear/shapes";
import * as thumbs from "@dicebear/thumbs";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { useTheme } from "./useTheme";

const STYLES = {
  thumbs,
  lorelei,
  notionists,
  "open-peeps": openPeeps,
  shapes,
} as const;

export const FALLBACK_SEED = "lembra";

export function avatarSvg(style: string, seed: string): string {
  const chosen = (STYLES as Record<string, typeof thumbs>)[style] ?? thumbs;
  return createAvatar(chosen, { seed: seed === "" ? FALLBACK_SEED : seed }).toString();
}

type Props = { style: string; seed: string; size: number };

export function Avatar({ style, seed, size }: Props) {
  const t = useTheme();
  const xml = useMemo(() => avatarSvg(style, seed), [style, seed]);
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
