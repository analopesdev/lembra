import { StyleSheet, View } from "react-native";

import { radius } from "./theme";
import { Text } from "./Text";
import { useTheme } from "./useTheme";

type Props = { label: string; tone?: "tint" | "success" | "danger" };

/** Etiqueta em pílula (ex.: "Em breve"). */
export function Tag({ label, tone = "tint" }: Props) {
  const t = useTheme();
  const bg = tone === "success" ? t.successTint : tone === "danger" ? t.dangerTint : t.tint;
  const fg = tone === "success" ? "success" : tone === "danger" ? "danger" : "onTint";
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text variant="legenda" tone={fg} style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: radius.pill, alignSelf: "flex-start" },
  text: { fontSize: 11, fontWeight: "700" },
});
