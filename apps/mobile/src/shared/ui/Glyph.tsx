import icons from "@dicebear/styles/icons.json";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import type { Colors } from "./useTheme";
import { useTheme } from "./useTheme";

interface GlyphElement {
  attributes: { d: string; "fill-rule"?: string; "clip-rule"?: string };
}

const VARIANTS = icons.components.icon.variants as unknown as Record<string, { elements: GlyphElement[] }>;

export const GLYPH_NAMES: readonly string[] = Object.keys(VARIANTS);
export const DEFAULT_GLYPH = "book";

const PALETTE = icons.colors as unknown as { background: { values: string[] }; icon: { values: string[] } };
export const GLYPH_BACKGROUNDS: readonly string[] = PALETTE.background.values;
export const GLYPH_INK = { dark: PALETTE.icon.values[0] ?? "", light: PALETTE.icon.values[1] ?? "" };

type Props = { name: string; size?: number; color?: keyof Colors | string };

export function Glyph({ name, size = 24, color = "text" }: Props) {
  const t = useTheme();
  const variant = VARIANTS[name] ?? VARIANTS[DEFAULT_GLYPH];
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 16 16">
        {variant?.elements.map((e, i) => (
          <Path
            key={i}
            d={e.attributes.d}
            fill={t[color as keyof Colors] ?? color}
            fillRule={e.attributes["fill-rule"] === "evenodd" ? "evenodd" : "nonzero"}
            clipRule={e.attributes["clip-rule"] === "evenodd" ? "evenodd" : "nonzero"}
          />
        ))}
      </Svg>
    </View>
  );
}
