import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import type { Collection, Importance } from "@/domain/types";
import { Button, Icon, Input, Tag, Text } from "@/shared/ui";
import { space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

type Props = {
  front: string;
  onFront: (v: string) => void;
  back: string;
  onBack: (v: string) => void;
  collections: readonly Collection[];
  collectionId: string | null;
  onCollection: (id: string) => void;
  importance: Importance;
  onImportance: (v: Importance) => void;
  errors: { front?: string; back?: string; collection?: string };
  savedNotice: boolean;
  busy?: boolean;
  onSave: () => void;
  onSaveAndNew: () => void;
  onClose: () => void;
};

const TYPES = ["basic", "reversed", "cloze", "typed"] as const;
const LEVELS: Importance[] = [1, 2, 3];

export function NewCardView(p: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("collection.back")}
          onPress={p.onClose}
          style={[styles.back, { borderColor: t.border, backgroundColor: t.surface }]}
        >
          <Icon icon={ChevronLeft} size={20} strokeWidth={2.2} />
        </Pressable>
        <Text variant="titulo" accessibilityRole="header" style={styles.title}>
          {tr("card.newTitle")}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("card.save")}
          onPress={p.onSave}
          disabled={p.busy}
          style={styles.saveLink}
        >
          <Text variant="subtitulo" tone="link" style={styles.saveText}>
            {tr("card.save")}
          </Text>
        </Pressable>
      </View>

      <View style={styles.group}>
        <Text variant="label">{tr("card.type")}</Text>
        <View accessibilityRole="radiogroup" style={styles.row}>
          {TYPES.map((type) => {
            const on = type === "basic";
            return (
              <Pressable
                key={type}
                accessibilityRole="radio"
                accessibilityLabel={
                  on ? tr(`card.types.${type}`) : `${tr(`card.types.${type}`)}, ${tr("add.soon")}`
                }
                accessibilityState={{ selected: on, disabled: !on }}
                disabled={!on}
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? t.primary : t.surface,
                    borderColor: on ? t.primary : t.border,
                    opacity: on ? 1 : 0.55,
                  },
                ]}
              >
                <Text variant="label" tone={on ? "onPrimary" : "text"} style={styles.chipText}>
                  {tr(`card.types.${type}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Tag label={tr("add.soon")} />
      </View>

      <Input
        label={tr("card.front")}
        value={p.front}
        onChangeText={p.onFront}
        minLines={4}
        error={p.errors.front}
      />
      <Input
        label={tr("card.back")}
        value={p.back}
        onChangeText={p.onBack}
        minLines={3}
        error={p.errors.back}
      />

      <View style={styles.group}>
        <Text variant="label">{tr("card.collection")}</Text>
        {p.collections.length === 0 ? (
          <Text variant="legenda" tone="textMuted">
            {tr("card.noCollection")}
          </Text>
        ) : (
          <View accessibilityRole="radiogroup" style={styles.wrapRow}>
            {p.collections.map((c) => {
              const on = c.id === p.collectionId;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="radio"
                  accessibilityLabel={c.name}
                  accessibilityState={{ selected: on }}
                  onPress={() => p.onCollection(c.id)}
                  style={[
                    styles.collectionChip,
                    {
                      backgroundColor: on ? t.tint : t.surface,
                      borderColor: on ? t.button : t.border,
                      borderWidth: on ? 2 : 1,
                    },
                  ]}
                >
                  <Text variant="label" tone={on ? "onTint" : "text"} style={styles.chipText}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {p.errors.collection ? (
          <Text variant="legenda" tone="danger" accessibilityRole="alert">
            {p.errors.collection}
          </Text>
        ) : null}
      </View>

      <View style={styles.group}>
        <View style={styles.labelRow}>
          <Text variant="label">{tr("card.importance")}</Text>
          <Text variant="legenda" tone="textMuted" style={styles.hint}>
            {tr("card.importanceHint")}
          </Text>
        </View>
        <View accessibilityRole="radiogroup" style={styles.row}>
          {LEVELS.map((level) => {
            const on = level === p.importance;
            return (
              <Pressable
                key={level}
                accessibilityRole="radio"
                accessibilityLabel={tr(`card.levels.${level}`)}
                accessibilityState={{ selected: on }}
                onPress={() => p.onImportance(level)}
                style={[
                  styles.chip,
                  { backgroundColor: on ? t.primary : t.surface, borderColor: on ? t.primary : t.border },
                ]}
              >
                <Text variant="label" tone={on ? "onPrimary" : "text"} style={styles.chipText}>
                  {tr(`card.levels.${level}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.flex} />
      {p.savedNotice ? (
        <Text variant="label" tone="success" accessibilityRole="alert" style={styles.notice}>
          {tr("card.saved")}
        </Text>
      ) : null}
      <Button label={tr("card.saveAndNew")} variant="secondary" onPress={p.onSaveAndNew} disabled={p.busy} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 56, paddingHorizontal: space.xl, paddingBottom: 28, gap: 18 },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: space.md },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, textAlign: "center", fontSize: 20 },
  saveLink: { minWidth: 40, minHeight: 44, alignItems: "flex-end", justifyContent: "center" },
  saveText: { fontSize: 15 },
  group: { gap: space.sm },
  row: { flexDirection: "row", gap: 6 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chipText: { fontWeight: "700" },
  collectionChip: {
    minHeight: 44,
    borderRadius: 14,
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  hint: { fontWeight: "500" },
  notice: { textAlign: "center" },
});
