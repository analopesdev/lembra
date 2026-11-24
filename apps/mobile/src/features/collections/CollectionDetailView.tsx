import { Check, ChevronLeft, ChevronRight, Crosshair, Pencil, Play, Plus, Target } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Button, Icon, Num, Tag, Text } from "@/shared/ui";
import { space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

import type { CardRowKind } from "./cardRow";

export interface CardListRow {
  readonly id: string;
  readonly front: string;
  readonly kind: CardRowKind;
  readonly due: string;
  readonly suspended: boolean;
}

type Props = {
  name: string;
  readinessPct: number;
  targetPct: number;
  examDaysLeft: number | null;
  dueCount: number;
  cardCount: number;
  draftCount: number;
  rows: readonly CardListRow[];
  hasMore: boolean;
  onLoadMore: () => void;
  onStudy: () => void;
  onOpenCard: (id: string) => void;
  onNewCard: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
};

function Stat({ value, suffix, label }: { value: React.ReactNode; suffix?: string; label: string }) {
  const t = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Text accessibilityLabel={`${value}${suffix ?? ""} ${label}`} style={styles.statValue}>
        <Num size={22}>{value}</Num>
        {suffix ? <Num size={22}>{suffix}</Num> : null}
      </Text>
      <Text variant="label" tone="textMuted" style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

export function CollectionDetailView(p: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const kindIcon = {
    due: { icon: Target, bg: t.tint, color: "onTint" as const },
    learning: { icon: Crosshair, bg: t.tint, color: "onTint" as const },
    mastered: { icon: Check, bg: t.successTint, color: "success" as const },
  };
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
        <Text variant="titulo" accessibilityRole="header" numberOfLines={1} style={styles.title}>
          {p.name}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("common.edit")}
          onPress={p.onEdit}
          style={styles.edit}
        >
          <Text variant="subtitulo" tone="link" style={styles.editText}>
            {tr("common.edit")}
          </Text>
        </Pressable>
      </View>

      <View style={styles.stats}>
        <Stat value={p.readinessPct} suffix="%" label={tr("collection.detail.ready")} />
        <Stat value={p.targetPct} suffix="%" label={tr("collection.detail.target")} />
        <Stat value={p.examDaysLeft ?? "—"} label={tr("collection.detail.examDays")} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr("collection.detail.study", { name: p.name })}
        onPress={p.onStudy}
        style={[styles.study, { backgroundColor: t.button }]}
      >
        <View style={styles.flex}>
          <Text variant="subtitulo" tone="onButton" numberOfLines={1} style={styles.studyTitle}>
            {tr("collection.detail.study", { name: p.name })}
          </Text>
          <Text variant="label" tone="onButton" style={styles.studySub}>
            {tr("collection.detail.ready_count", { count: p.dueCount })}
          </Text>
        </View>
        <View style={[styles.play, { backgroundColor: t.onButton }]}>
          <Icon icon={Play} size={16} color="button" filled />
        </View>
      </Pressable>

      <Text variant="legenda" tone="textMuted" accessibilityRole="header" style={styles.section}>
        {tr("collection.detail.cardsSection", { count: p.cardCount })}
      </Text>

      <View style={[styles.group, { backgroundColor: t.surface, borderColor: t.border }]}>
        {p.rows.map((r) => {
          const k = kindIcon[r.kind];
          return (
            <Pressable
              key={r.id}
              accessibilityRole="button"
              accessibilityLabel={r.front}
              onPress={() => p.onOpenCard(r.id)}
              style={[styles.row, { borderBottomColor: t.border }]}
            >
              <View style={[styles.rowIcon, { backgroundColor: k.bg }]}>
                <Icon icon={k.icon} size={18} color={k.color} />
              </View>
              <Text variant="corpo" numberOfLines={1} style={[styles.front, styles.flex]}>
                {r.front}
              </Text>
              {r.suspended ? <Tag label={tr("collection.detail.suspended")} /> : null}
              <Text variant="label" tone="textMuted" style={styles.due}>
                {r.due}
              </Text>
              <Icon icon={ChevronRight} size={18} color="textMuted" />
            </Pressable>
          );
        })}
        {p.draftCount > 0 ? (
          <View
            accessible
            accessibilityLabel={`${tr("collection.detail.drafts")}, ${tr("add.soon")}`}
            accessibilityState={{ disabled: true }}
            style={[styles.row, styles.soon, { borderBottomColor: t.border }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: t.surfaceMuted }]}>
              <Icon icon={Pencil} size={18} color="textMuted" />
            </View>
            <Text variant="corpo" style={[styles.front, styles.flex]}>
              {tr("collection.detail.drafts")}
            </Text>
            <Num size={13} tone="textMuted">
              {p.draftCount}
            </Num>
            <Icon icon={ChevronRight} size={18} color="textMuted" />
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("collection.detail.newCard")}
          onPress={p.onNewCard}
          style={[styles.row, styles.lastRow]}
        >
          <View style={[styles.rowIcon, { backgroundColor: t.surfaceMuted }]}>
            <Icon icon={Plus} size={18} color="textMuted" />
          </View>
          <Text variant="corpo" style={[styles.front, styles.flex]}>
            {tr("collection.detail.newCard")}
          </Text>
          <Icon icon={ChevronRight} size={18} color="textMuted" />
        </Pressable>
      </View>

      {p.rows.length === 0 ? (
        <Text variant="corpo" tone="textMuted" style={styles.empty}>
          {tr("collection.detail.noCards")}
        </Text>
      ) : null}

      {p.hasMore ? <Button label={tr("common.loadMore")} variant="secondary" onPress={p.onLoadMore} /> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr("common.delete")}
        onPress={p.onDelete}
        style={styles.delete}
      >
        <Text variant="label" tone="danger" style={styles.deleteText}>
          {tr("collection.delete.action")}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 40, gap: space.md },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: space.xs },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, textAlign: "center", fontSize: 20 },
  edit: { minWidth: 40, minHeight: 44, alignItems: "flex-end", justifyContent: "center" },
  editText: { fontSize: 15, fontWeight: "700" },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, gap: 2, padding: 14, borderRadius: 18, borderWidth: 1 },
  statValue: { flexDirection: "row" },
  statLabel: { fontSize: 12, fontWeight: "600" },
  study: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18, borderRadius: 20 },
  studyTitle: { fontSize: 17, fontWeight: "700" },
  studySub: { fontWeight: "500" },
  play: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  section: {
    marginHorizontal: 4,
    marginTop: space.sm,
    fontWeight: "700",
    letterSpacing: 0.72,
    textTransform: "uppercase",
  },
  group: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  row: {
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
  },
  lastRow: { borderBottomWidth: 0 },
  soon: { opacity: 0.6 },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  front: { fontSize: 15, fontWeight: "600" },
  due: { fontWeight: "600" },
  empty: { textAlign: "center", paddingVertical: space.xl },
  delete: { alignSelf: "center", padding: space.md },
  deleteText: { fontWeight: "700" },
});
