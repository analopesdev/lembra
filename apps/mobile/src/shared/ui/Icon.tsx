import type { LucideIcon } from "lucide-react-native";

import type { Colors } from "./useTheme";
import { useTheme } from "./useTheme";

type Props = { icon: LucideIcon; size?: number; color?: keyof Colors; strokeWidth?: number };

/** Ícone do Lucide no padrão do kit: traço 2, cantos arredondados, 20–24 px. Decorativo por padrão. */
export function Icon({ icon: Glyph, size = 24, color = "text", strokeWidth = 2 }: Props) {
  const t = useTheme();
  return (
    <Glyph
      size={size}
      color={t[color]}
      strokeWidth={strokeWidth}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
