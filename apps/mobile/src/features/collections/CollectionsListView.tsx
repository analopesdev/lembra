import { Calendar, Plus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import type { CollectionCard } from "@/features/today";
import Svg, { Circle } from "react-native-svg";

import { Button, Icon, Num, Text } from "@/shared/ui";
import { space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

import { CollectionGlyph } from "./CollectionGlyph";
import { toneColors } from "./icons";

type Props = {
  collections: readonly CollectionCard[];
  onOpen: (id: string) => void;
  onCreate: () => void;
};

function Stat({ value, label }: { value: number; label: string }) {
  const t = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Num size={22}>{value}</Num>
      <Text variant="label" tone="textMuted" style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

const RING = 44;
const STROKE = 5;

function MiniRing({ value, label, children }: { value: number; label: string; children: React.ReactNode }) {
  const t = useTheme();
  const v = Math.min(1, Math.max(0, value));
  const r = (RING - STROKE) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      style={styles.ring}
    >
      <Svg width={RING} height={RING} style={styles.ringSvg}>
        <Circle cx={RING / 2} cy={RING / 2} r={r} stroke={t.border} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          stroke={t.link}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`}
          transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function CollectionsListView({ collections, onOpen, onCreate }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const totalDue = collections.reduce((n, c) => n + c.dueToday, 0);
  const totalCards = collections.reduce((n, c) => n + c.cardCount, 0);
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
        <>
          <View style={styles.stats}>
            <Stat value={collections.length} label={tr("collection.statCollections")} />
            <Stat value={totalDue} label={tr("collection.statDue")} />
            <Stat value={totalCards} label={tr("collection.statCards")} />
          </View>
          {collections.map((c) => {
            const tone = toneColors(c.tone, t);
            const pct = Math.round(Math.min(1, Math.max(0, c.progress)) * 100);
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`${c.name}, ${tr("collection.detail.cardsDue", { count: c.dueToday })}`}
                onPress={() => onOpen(c.id)}
                style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}
              >
                <View style={[styles.rowIcon, { backgroundColor: tone.bg }]}>
                  <CollectionGlyph name={c.icon} size={22} color={tone.fg} />
                </View>
                <View style={styles.rowText}>
                  <Text variant="subtitulo" style={styles.name}>
                    {c.name}
                  </Text>
                  <Text variant="label" tone="textMuted">
                    {tr("collection.detail.cardsDue", { count: c.dueToday })}
                    {" · "}
                    {tr("collection.cardsCount", { count: c.cardCount })}
                  </Text>
                  {c.examDaysLeft !== null && c.examDaysLeft >= 0 ? (
                    <View style={[styles.exam, { backgroundColor: t.tint }]}>
                      <Icon icon={Calendar} size={12} color="onTint" />
                      <Text variant="legenda" tone="onTint" style={styles.examText}>
                        {c.examDaysLeft === 0
                          ? tr("collection.examToday")
                          : tr("collection.examIn", { count: c.examDaysLeft })}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <MiniRing value={c.progress} label={tr("collection.retainedLabel", { name: c.name, pct })}>
                  <Num size={13}>{pct}</Num>
                </MiniRing>
              </Pressable>
            );
          })}
        </>
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
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, gap: 2, padding: 14, borderRadius: 18, borderWidth: 1 },
  statLabel: { fontSize: 12, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: space.lg,
    borderRadius: 20,
    borderWidth: 1,
  },
  rowIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1, gap: 4 },
  name: { fontSize: 17, fontWeight: "700" },
  exam: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    marginTop: 2,
  },
  examText: { fontWeight: "700" },
  ring: { width: RING, height: RING, alignItems: "center", justifyContent: "center" },
  ringSvg: { position: "absolute" },
});
