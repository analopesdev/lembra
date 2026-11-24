import type { LucideIcon } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { Plus } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { useGlassNav } from "@/shared/lib/glassNav";

import { Icon } from "./Icon";
import { space } from "./theme";
import { Text } from "./Text";
import { useTheme, useThemeName } from "./useTheme";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

type Props = {
  items: readonly NavItem[]; // 4 itens: o botão "+" fica no centro
  active: string;
  onSelect: (key: string) => void;
  onAdd: () => void;
  addLabel: string;
};

/** Barra flutuante de 68 px: aba ativa em pílula `tint` com ícone + rótulo; "+" central em `button`. */
export function BottomNav({ items, active, onSelect, onAdd, addLabel }: Props) {
  const t = useTheme();
  const glass = useGlassNav();
  const dark = useThemeName() === "escuro";
  const half = Math.ceil(items.length / 2);
  const render = (item: NavItem) => {
    const on = item.key === active;
    return (
      <Pressable
        key={item.key}
        accessibilityRole="tab"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: on }}
        onPress={() => onSelect(item.key)}
        style={[styles.tab, on && { backgroundColor: t.tint }]}
      >
        <Icon icon={item.icon} size={22} color={on ? "onTint" : "textMuted"} />
        {on ? (
          <Text variant="label" tone="onTint">
            {item.label}
          </Text>
        ) : null}
      </Pressable>
    );
  };
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        glass ? { borderColor: t.border } : { backgroundColor: t.surface, borderColor: t.border },
      ]}
    >
      {glass ? (
        <BlurView
          intensity={60}
          tint={dark ? "dark" : "light"}
          style={[StyleSheet.absoluteFill, styles.glass]}
        />
      ) : null}
      {items.slice(0, half).map(render)}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={addLabel}
        onPress={onAdd}
        style={[styles.add, { backgroundColor: t.button }]}
      >
        <Icon icon={Plus} size={24} color="onButton" />
      </Pressable>
      {items.slice(half).map(render)}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: { borderRadius: 34 },
  bar: {
    position: "absolute",
    left: space.lg,
    right: space.lg,
    bottom: space["2xl"],
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  tab: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  add: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
});
