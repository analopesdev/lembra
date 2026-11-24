import { contrastOf } from "@/domain/collection/color";
import type { CollectionTone } from "@/domain/types";
import { DEFAULT_GLYPH, GLYPH_BACKGROUNDS, GLYPH_INK, type Colors } from "@/shared/ui";

export { GLYPH_NAMES as ICON_ORDER } from "@/shared/ui";

export const DEFAULT_COLLECTION_ICON = DEFAULT_GLYPH;
export const TONE_ORDER: readonly CollectionTone[] = GLYPH_BACKGROUNDS;
export const DEFAULT_COLLECTION_TONE: CollectionTone = GLYPH_BACKGROUNDS[0] ?? "";

const LEGACY_ICONS: Record<string, string> = {
  bone: "bandaid",
  heart: "heart",
  flask: "droplet",
  help: "lightbulb",
  chart: "trophy",
  copy: "book",
};

const LEGACY_TONES: Record<string, { bg: keyof Colors; fg: keyof Colors }> = {
  tint: { bg: "tint", fg: "onTint" },
  collection2: { bg: "collection2", fg: "onCollection2" },
  collection3: { bg: "collection3", fg: "onCollection3" },
};

export function resolveCollectionIcon(name: string): string {
  return LEGACY_ICONS[name] ?? name;
}

export function toneColors(tone: CollectionTone, theme: Colors): { bg: string; fg: string } {
  const legacy = LEGACY_TONES[tone];
  if (legacy) return { bg: theme[legacy.bg], fg: theme[legacy.fg] };
  return { bg: tone, fg: GLYPH_INK[contrastOf(tone)] };
}
