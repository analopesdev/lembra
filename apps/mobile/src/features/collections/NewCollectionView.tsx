import { Check, ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import type { CollectionIconName, CollectionTone } from "@/domain/types";
import { Button, Card, Icon, Input, Text } from "@/shared/ui";
import { radius, space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

import { COLLECTION_ICONS, ICON_ORDER, TONE_COLORS, TONE_ORDER } from "./icons";

type Props = {
  name: string;
  onName: (v: string) => void;
  icon: CollectionIconName;
  onIcon: (v: CollectionIconName) => void;
  tone: CollectionTone;
  onTone: (v: CollectionTone) => void;
  exam: string;
  onExam: (v: string) => void;
  examDaysLeft: number | null;
  nameError?: string;
  examError?: string;
  busy?: boolean;
  onSubmit: () => void;
  onBack: () => void;
};

export function NewCollectionView(p: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const tone = TONE_COLORS[p.tone];
  const examLine =
    p.examDaysLeft === null
      ? null
      : p.examDaysLeft === 0
        ? tr("collection.examToday")
        : tr("collection.examIn", { count: p.examDaysLeft });
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
          onPress={p.onBack}
          style={[styles.back, { borderColor: t.border, backgroundColor: t.surface }]}
        >
          <Icon icon={ChevronLeft} size={20} strokeWidth={2.2} />
        </Pressable>
        <Text variant="titulo" accessibilityRole="header" style={styles.title}>
          {tr("collection.newTitle")}
        </Text>
        <View style={styles.spacer} />
      </View>

      <Card tone="tint" style={styles.preview}>
        <View style={[styles.previewIcon, { backgroundColor: t.surface }]}>
          <Icon icon={COLLECTION_ICONS[p.icon]} size={26} color={tone.fg} />
        </View>
        <View style={styles.previewText}>
          <Text variant="subtitulo" style={styles.previewName} numberOfLines={1}>
            {p.name.trim() === "" ? tr("collection.namePlaceholder") : p.name}
          </Text>
          {examLine ? (
            <Text variant="label" tone="onTint" style={styles.examLine}>
              {examLine}
            </Text>
          ) : null}
        </View>
      </Card>

      <Input
        label={tr("collection.name")}
        value={p.name}
        onChangeText={p.onName}
        placeholder={tr("collection.namePlaceholder")}
        error={p.nameError}
        maxLength={80}
      />

      <View style={styles.group}>
        <Text variant="label">{tr("collection.icon")}</Text>
        <View accessibilityRole="radiogroup" style={styles.row}>
          {ICON_ORDER.map((name) => {
            const on = name === p.icon;
            return (
              <Pressable
                key={name}
                accessibilityRole="radio"
                accessibilityLabel={tr(`collection.icons.${name}`)}
                accessibilityState={{ selected: on }}
                onPress={() => p.onIcon(name)}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: on ? t.tint : t.surface,
                    borderColor: on ? t.button : t.border,
                    borderWidth: on ? 2 : 1,
                  },
                ]}
              >
                <Icon icon={COLLECTION_ICONS[name]} size={22} color={on ? "onTint" : "textMuted"} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <Text variant="label">{tr("collection.color")}</Text>
        <View accessibilityRole="radiogroup" style={styles.swatches}>
          {TONE_ORDER.map((name) => {
            const on = name === p.tone;
            const c = TONE_COLORS[name];
            return (
              <Pressable
                key={name}
                accessibilityRole="radio"
                accessibilityLabel={tr(`collection.tones.${name}`)}
                accessibilityState={{ selected: on }}
                onPress={() => p.onTone(name)}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: t[c.bg],
                    borderColor: on ? t.button : t.border,
                    borderWidth: on ? 2 : 1,
                  },
                ]}
              >
                {on ? <Icon icon={Check} size={18} strokeWidth={3} color={c.fg} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Input
        label={tr("collection.exam")}
        value={p.exam}
        onChangeText={p.onExam}
        placeholder={tr("collection.examPlaceholder")}
        keyboardType="number-pad"
        hint={tr("collection.examHint")}
        error={p.examError}
      />

      <View style={styles.flex} />
      <Button label={tr("collection.create")} onPress={p.onSubmit} loading={p.busy} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 56, paddingHorizontal: space.xl, paddingBottom: 28, gap: 22 },
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
  spacer: { width: 40 },
  preview: { flexDirection: "row", alignItems: "center", gap: 14, padding: space.lg },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  previewText: { flex: 1, gap: 2 },
  previewName: { fontSize: 17, fontWeight: "800" },
  examLine: { fontWeight: "400" },
  group: { gap: space.sm },
  row: { flexDirection: "row", gap: space.sm },
  iconBtn: { flex: 1, height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  swatches: { flexDirection: "row", gap: 10 },
  swatch: { width: 52, height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});
