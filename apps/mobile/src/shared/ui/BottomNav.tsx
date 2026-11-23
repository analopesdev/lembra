import type { LucideIcon } from "lucide-react-native";
import { Plus } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "./Icon";
import { space } from "./theme";
import { Text } from "./Text";
import { useTheme } from "./useTheme";

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
      style={[styles.bar, { backgroundColor: t.surface, borderColor: t.border }]}
    >
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
  bar: {
    position: "absolute",
    left: space.lg,
    right: space.lg,
    bottom: space["2xl"],
    height: 68,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  tab: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  add: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
