import { ChevronLeft, Pencil, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import type { Card as CardModel, Collection } from "@/domain/types";
import { Button, Card, Icon, Tag, Text } from "@/shared/ui";
import { space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

import { CollectionGlyph } from "./CollectionGlyph";
import { toneColors } from "./icons";

type Props = {
  collection: Collection;
  examDaysLeft: number | null;
  cards: readonly CardModel[];
  hasMore: boolean;
  onLoadMore: () => void;
  onOpenCard: (id: string) => void;
  onNewCard: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
};

export function CollectionDetailView(p: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const tone = toneColors(p.collection.tone, t);
  const examLine =
    p.examDaysLeft === null
      ? null
      : p.examDaysLeft === 0
        ? tr("collection.examToday")
        : tr("collection.examIn", { count: p.examDaysLeft });
  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("collection.back")}
          onPress={p.onBack}
          style={[styles.iconBtn, { borderColor: t.border, backgroundColor: t.surface }]}
        >
          <Icon icon={ChevronLeft} size={20} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.flex} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("common.edit")}
          onPress={p.onEdit}
          style={[styles.iconBtn, { borderColor: t.border, backgroundColor: t.surface }]}
        >
          <Icon icon={Pencil} size={18} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("common.delete")}
          onPress={p.onDelete}
          style={[styles.iconBtn, { borderColor: t.border, backgroundColor: t.surface }]}
        >
          <Icon icon={Trash2} size={18} color="danger" />
        </Pressable>
      </View>

      <Card tone="tint" style={styles.summary}>
        <View style={[styles.summaryIcon, { backgroundColor: tone.bg }]}>
          <CollectionGlyph name={p.collection.icon} size={26} color={tone.fg} />
        </View>
        <View style={styles.flex}>
          <Text variant="titulo" accessibilityRole="header">
            {p.collection.name}
          </Text>
          {examLine ? (
            <Text variant="label" tone="onTint" style={styles.exam}>
              {examLine}
            </Text>
          ) : null}
        </View>
      </Card>

      <Button label={tr("collection.detail.newCard")} onPress={p.onNewCard} />

      {p.cards.length === 0 ? (
        <Text variant="corpo" tone="textMuted" style={styles.empty}>
          {tr("collection.detail.noCards")}
        </Text>
      ) : (
        p.cards.map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={c.front}
            onPress={() => p.onOpenCard(c.id)}
          >
            <Card style={styles.cardRow}>
              <View style={styles.flex}>
                <Text variant="corpo" numberOfLines={2} style={styles.front}>
                  {c.front}
                </Text>
                <Text variant="legenda" tone="textMuted" numberOfLines={1}>
                  {c.back}
                </Text>
              </View>
              {c.status === "suspended" ? <Tag label={tr("collection.detail.suspended")} /> : null}
            </Card>
          </Pressable>
        ))
      )}

      {p.hasMore ? <Button label={tr("common.loadMore")} variant="secondary" onPress={p.onLoadMore} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 56, paddingHorizontal: space.xl, paddingBottom: 40, gap: space.md },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: space.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summary: { flexDirection: "row", alignItems: "center", gap: 14, padding: space.lg },
  summaryIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  exam: { fontWeight: "400" },
  empty: { textAlign: "center", paddingVertical: space.xl },
  cardRow: { flexDirection: "row", alignItems: "center", gap: space.md, padding: 14 },
  front: { fontWeight: "600" },
});
