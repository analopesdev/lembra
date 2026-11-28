import { Mic, X } from "lucide-react-native";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { ContentDoc } from "@/domain/card/content";
import { Icon, Text } from "@/shared/ui";
import { radius, space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

type Item = { id: string; kind: "image" | "audio" | "video"; uri: string | null };

type Props = {
  doc: ContentDoc | null;
  uris: Record<string, string>;
  onRemove: (mediaId: string) => void;
};

export function MediaStrip({ doc, uris, onRemove }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const items: Item[] = (doc?.content ?? []).flatMap((b) =>
    b.type === "image" || b.type === "audio" || b.type === "video"
      ? [{ id: b.attrs.mediaId, kind: b.type, uri: uris[b.attrs.mediaId] ?? null }]
      : [],
  );
  if (items.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.row}
      style={[styles.strip, { borderTopColor: t.border }]}
    >
      {items.map((item) => {
        const name = item.kind === "image" ? tr("card.tools.image") : tr("card.tools.audio");
        return (
          <View key={item.id} style={styles.item}>
            {item.kind === "image" && item.uri ? (
              <Image source={{ uri: item.uri }} style={styles.thumb} accessibilityLabel={name} />
            ) : (
              <View
                accessible
                accessibilityLabel={name}
                style={[styles.thumb, styles.audio, { backgroundColor: t.tint }]}
              >
                <Icon icon={Mic} size={22} color="onTint" />
                <Text variant="legenda" tone="onTint">
                  {name}
                </Text>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tr("card.tools.remove", { name })}
              hitSlop={8}
              onPress={() => onRemove(item.id)}
              style={[styles.remove, { backgroundColor: t.text }]}
            >
              <Icon icon={X} size={14} strokeWidth={2.6} color="background" />
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { borderTopWidth: 1, flexGrow: 0 },
  row: { gap: space.sm, padding: space.sm },
  item: { position: "relative" },
  thumb: { width: 88, height: 88, borderRadius: radius.sm },
  audio: { alignItems: "center", justifyContent: "center", gap: 4 },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
