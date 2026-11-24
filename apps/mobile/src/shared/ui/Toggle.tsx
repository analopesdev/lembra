import { Pressable, StyleSheet, View } from "react-native";

import { radius } from "./theme";
import { useTheme } from "./useTheme";

type Props = { value: boolean; onValueChange: (v: boolean) => void; label: string };

export function Toggle({ value, onValueChange, label }: Props) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={[
        styles.track,
        { backgroundColor: value ? t.button : t.border, justifyContent: value ? "flex-end" : "flex-start" },
      ]}
    >
      <View style={[styles.knob, { backgroundColor: t.onHero }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 48, height: 30, borderRadius: radius.pill, padding: 3, flexDirection: "row" },
  knob: { width: 24, height: 24, borderRadius: radius.pill },
});
