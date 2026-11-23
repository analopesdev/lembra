import {
  Bone,
  ChartColumn,
  CircleHelp,
  Copy,
  FlaskConical,
  Heart,
  type LucideIcon,
} from "lucide-react-native";

import type { CollectionIconName, CollectionTone } from "@/domain/types";
import type { Colors } from "@/shared/ui";

export const COLLECTION_ICONS: Record<CollectionIconName, LucideIcon> = {
  bone: Bone,
  heart: Heart,
  flask: FlaskConical,
  help: CircleHelp,
  chart: ChartColumn,
  copy: Copy,
};

export const ICON_ORDER: readonly CollectionIconName[] = ["bone", "heart", "flask", "help", "chart", "copy"];
export const TONE_ORDER: readonly CollectionTone[] = ["tint", "collection2", "collection3"];

export const TONE_COLORS: Record<CollectionTone, { bg: keyof Colors; fg: keyof Colors }> = {
  tint: { bg: "tint", fg: "onTint" },
  collection2: { bg: "collection2", fg: "onCollection2" },
  collection3: { bg: "collection3", fg: "onCollection3" },
};
