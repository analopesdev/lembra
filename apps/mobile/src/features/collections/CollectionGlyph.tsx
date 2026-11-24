import type { Colors } from "@/shared/ui";
import { Glyph } from "@/shared/ui";

import { resolveCollectionIcon } from "./icons";

type Props = { name: string; size?: number; color?: keyof Colors | string };

export function CollectionGlyph({ name, size, color }: Props) {
  return <Glyph name={resolveCollectionIcon(name)} size={size} color={color} />;
}
