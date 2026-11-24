import { ChevronRight, Plus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import type { CollectionCard } from "@/features/today";
import { Button, Icon, ProgressBar, Text } from "@/shared/ui";
import { radius, space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

import { COLLECTION_ICONS, TONE_COLORS } from "./icons";

type Props = {
  collections: readonly CollectionCard[];
  onOpen: (id: string) => void;
  onCreate: () => void;
};

export function CollectionsListView({ collections, onOpen, onCreate }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="titulo" accessibilityRole="header" style={styles.flex}>
          {tr("collection.listTitle")}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("collection.newTitle")}
          onPress={onCreate}
          style={[styles.add, { backgroundColor: t.button }]}
        >
          <Icon icon={Plus} size={22} color="onButton" />
        </Pressable>
      </View>

      {collections.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="subtitulo">{tr("collection.empty")}</Text>
          <Text variant="corpo" tone="textMuted" style={styles.center}>
            {tr("collection.emptyText")}
          </Text>
          <Button label={tr("collection.newTitle")} onPress={onCreate} />
        </View>
      ) : (
        collections.map((c) => {
          const tone = TONE_COLORS[c.tone];
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`${c.name}, ${tr("collection.detail.cardsDue", { count: c.dueToday })}`}
              onPress={() => onOpen(c.id)}
              style={[styles.row, { backgroundColor: t[tone.bg] }]}
            >
              <View style={[styles.rowIcon, { backgroundColor: t.surface }]}>
                <Icon icon={COLLECTION_ICONS[c.icon]} size={22} color={tone.fg} />
              </View>
              <View style={styles.rowText}>
                <Text variant="subtitulo">{c.name}</Text>
                <Text variant="legenda" style={[styles.due, { color: t[tone.fg] }]}>
                  {tr("collection.detail.cardsDue", { count: c.dueToday })}
                </Text>
                <ProgressBar value={c.progress} fill={tone.fg} track="surface" accessibilityLabel={c.name} />
              </View>
              <Icon icon={ChevronRight} size={20} color="textMuted" />
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 56, paddingHorizontal: space.xl, paddingBottom: 120, gap: space.md },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: space.md, marginBottom: space.sm },
  add: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  empty: { gap: space.md, alignItems: "stretch", paddingTop: space["3xl"] },
  center: { textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: space.lg, borderRadius: radius.lg },
  rowIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1, gap: 6 },
  due: { fontWeight: "600" },
});
