import { Bell, Calendar, Check, ChevronRight, Minus, Play, Zap } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { CollectionGlyph, toneColors } from "@/features/collections";
import { Avatar, Card, Icon, Num, ProgressBar, Ring, Text } from "@/shared/ui";
import { radius, space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

import type { CollectionCard, TodayModel, WeekDay } from "./model";

type Props = {
  model: TodayModel;
  onStartSession?: () => void;
  onSeeCollections?: () => void;
  onOpenCollection?: (id: string) => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
};

function WeekStrip({ week }: { week: readonly WeekDay[] }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={[styles.strip, { backgroundColor: t.surface }]}>
      {week.map((d) => {
        const label = tr(`today.week.${d.key}`);
        const a11y =
          d.status === "done"
            ? tr("today.weekDone")
            : d.status === "frozen"
              ? tr("today.weekFrozen")
              : tr("today.weekToday");
        return (
          <View key={d.key} accessible accessibilityLabel={`${label}: ${a11y}`} style={styles.day}>
            {d.status === "today" || d.status === "pending" ? (
              <View style={[styles.dayToday, { borderColor: t.button }]} />
            ) : (
              <View style={[styles.dayBox, { backgroundColor: d.status === "done" ? t.primary : t.tint }]}>
                <Icon
                  icon={d.status === "done" ? Check : Minus}
                  size={16}
                  strokeWidth={d.status === "done" ? 3 : 2}
                  color={d.status === "done" ? "onPrimary" : "textMuted"}
                />
              </View>
            )}
            <Text variant="label" tone={d.status === "today" ? "link" : "textMuted"} style={styles.dayLabel}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function CollectionTile({ item, onPress }: { item: CollectionCard; onPress?: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const tone = toneColors(item.tone, t);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${tr("today.dueToday", { count: item.dueToday })}`}
      onPress={onPress}
      style={[styles.tile, { backgroundColor: tone.bg }]}
    >
      <View style={[styles.tileIcon, { backgroundColor: tone.well }]}>
        <CollectionGlyph name={item.icon} size={20} color={tone.fg} />
      </View>
      <View style={styles.flex} />
      <Text variant="subtitulo" style={styles.tileName}>
        {item.name}
      </Text>
      <Text variant="legenda" style={[styles.tileDue, { color: tone.fg }]}>
        {tr("today.dueToday", { count: item.dueToday })}
      </Text>
      <ProgressBar value={item.progress} fill={tone.fg} track="surface" accessibilityLabel={item.name} />
    </Pressable>
  );
}

export function TodayView({
  model,
  onStartSession,
  onSeeCollections,
  onOpenCollection,
  onOpenNotifications,
  onOpenProfile,
}: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const empty = model.dueCount === 0;
  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("tabs.profile")}
          onPress={onOpenProfile}
          style={styles.avatar}
        >
          <Avatar seed={model.avatarSeed} size={44} />
        </Pressable>
        <View style={styles.flex}>
          <Text variant="label" tone="textMuted" style={styles.greeting}>
            {model.userName === ""
              ? tr("today.greetingGuest")
              : tr("today.greeting", { name: model.userName })}
          </Text>
          <Text variant="titulo">{tr("today.title")}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("today.notifications")}
          onPress={onOpenNotifications}
          style={[styles.bell, { borderColor: t.border, backgroundColor: t.surface }]}
        >
          <Icon icon={Bell} size={20} />
        </Pressable>
      </View>

      <View style={[styles.hero, { backgroundColor: t.hero }]}>
        <View style={styles.heroTop}>
          <Ring
            value={model.memoryRatio}
            accessibilityLabel={`${model.memoryRetained} ${tr("today.inMemory")}`}
          >
            <Num size={32} tone="onHero">
              {model.memoryRetained}
            </Num>
            <Text variant="legenda" tone="onHeroMuted" style={styles.ringCaption}>
              {tr("today.inMemory")}
            </Text>
          </Ring>
          <View style={styles.heroSide}>
            {model.streakDays !== null ? (
              <View style={styles.streakRow}>
                <View style={[styles.streakIcon, { backgroundColor: t.heroTrack }]}>
                  <Icon icon={Zap} size={18} color="accent" />
                </View>
                <View>
                  <Num size={16} tone="onHero" style={styles.streakNum}>
                    {tr("today.streakDays", { count: model.streakDays })}
                  </Num>
                  <Text variant="legenda" tone="onHeroMuted">
                    {tr("today.streakLabel")}
                  </Text>
                </View>
              </View>
            ) : null}
            {model.retentionPct !== null ? (
              <Text variant="legenda" tone="onHeroMuted">
                {tr("today.retention", { value: model.retentionPct, target: model.retentionTargetPct })}
              </Text>
            ) : null}
          </View>
        </View>
        {model.week.length > 0 ? <WeekStrip week={model.week} /> : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr("today.startSession")}
        onPress={onStartSession}
        disabled={empty}
        style={[styles.session, { backgroundColor: t.button, opacity: empty ? 0.6 : 1 }]}
      >
        <View style={[styles.sessionIcon, { backgroundColor: t.onButton }]}>
          <Icon icon={Play} size={16} color="onHero" strokeWidth={0} filled />
        </View>
        <View style={styles.flex}>
          <Text variant="subtitulo" tone="onButton">
            {tr("today.startSession")}
          </Text>
          <Text variant="legenda" tone="onButton" style={styles.sessionSub}>
            {empty
              ? model.caughtUpInDays === null
                ? tr("today.allCaughtUp")
                : tr("today.caughtUpIn", { days: model.caughtUpInDays })
              : tr("today.cardsReady", { count: model.dueCount })}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: t.accent }]}>
          <Num size={13} tone="onButton" style={styles.pillNum}>
            {tr("today.minutes", { count: model.sessionMinutes })}
          </Num>
        </View>
      </Pressable>

      {!empty && model.caughtUpInDays !== null ? (
        <Text variant="legenda" tone="textMuted" style={styles.caughtUp}>
          {tr("today.caughtUpIn", { days: model.caughtUpInDays })}
        </Text>
      ) : null}

      {model.collections.length > 0 ? (
        <>
          <View style={styles.sectionHead}>
            <Text variant="subtitulo" style={styles.sectionTitle}>
              {tr("today.collections")}
            </Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={tr("today.seeAll")}
              onPress={onSeeCollections}
            >
              <Text variant="label" tone="link" style={styles.seeAll}>
                {tr("today.seeAll")}
              </Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}
            contentContainerStyle={styles.tiles}
          >
            {model.collections.map((c) => (
              <CollectionTile key={c.id} item={c} onPress={() => onOpenCollection?.(c.id)} />
            ))}
          </ScrollView>
        </>
      ) : null}

      {model.exam ? (
        <Card style={styles.exam}>
          <View style={[styles.examIcon, { backgroundColor: t.tint }]}>
            <Icon icon={Calendar} size={22} color="onTint" />
          </View>
          <View style={styles.flex}>
            <Text variant="subtitulo" style={styles.examTitle}>
              {tr("today.exam", { name: model.exam.name })}
            </Text>
            <Text variant="legenda" tone="textMuted">
              {model.exam.readinessPct === null
                ? tr("today.examLineShort", { count: model.exam.daysLeft })
                : tr("today.examLine", { days: model.exam.daysLeft, readiness: model.exam.readinessPct })}
            </Text>
          </View>
          <Icon icon={ChevronRight} size={20} color="textMuted" />
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 56, paddingHorizontal: space.xl, paddingBottom: 120, gap: space.lg },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: space.md },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  greeting: { fontWeight: "400" },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { borderRadius: radius.xl, padding: space.xl, gap: space.lg },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 18 },
  ringCaption: { fontSize: 11, fontWeight: "600" },
  heroSide: { gap: 10, flexShrink: 1 },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  streakIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  streakNum: { lineHeight: 20 },
  strip: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 18,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  day: { alignItems: "center", gap: 6 },
  dayBox: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dayToday: { width: 34, height: 34, margin: 2, borderRadius: 12, borderWidth: 2, borderStyle: "dashed" },
  dayLabel: { fontSize: 12 },
  session: {
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  sessionIcon: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionSub: { opacity: 0.85 },
  caughtUp: { textAlign: "center" },
  pill: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: radius.pill },
  pillNum: { fontWeight: "600", lineHeight: 16 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontWeight: "800" },
  seeAll: { fontWeight: "700" },
  bleed: { marginRight: -space.xl },
  tiles: { gap: space.md, paddingRight: space.xl },
  tile: { width: 152, height: 140, padding: space.lg, borderRadius: radius.lg, gap: 6 },
  tileIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tileName: { fontSize: 15 },
  tileDue: { fontWeight: "600" },
  exam: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: space.lg,
  },
  examIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  examTitle: { fontSize: 15 },
});
