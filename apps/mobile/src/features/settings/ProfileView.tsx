import { ChevronLeft, Minus, Plus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { MINUTE_OPTIONS, type DailyMinutes, type ThemePreference } from "@/domain/settings/settings";
import { Card, Icon, Num, Tag, Text } from "@/shared/ui";
import { space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

type Props = {
  minutes: DailyMinutes;
  onMinutes: (v: DailyMinutes) => void;
  newCards: number;
  onNewCards: (v: number) => void;
  offWeekdays: readonly number[];
  onToggleWeekday: (day: number) => void;
  theme: ThemePreference;
  onTheme: (v: ThemePreference) => void;
  retainedCount: number;
  version: string;
  onBack: () => void;
};

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
const THEMES: ThemePreference[] = ["light", "dark", "auto"];
const SOON_ROWS = {
  memoryGoal: "profile.memoryGoal",
  reminder: "profile.dailyReminder",
  faceId: "profile.faceId",
  feedback: "profile.feedback",
  report: "profile.reportProblem",
  rate: "profile.rate",
  sync: "profile.sync",
  export: "profile.export",
  privacy: "profile.privacy",
  signOut: "profile.signOut",
  delete: "profile.deleteAccount",
} as const;

function Section({ title }: { title: string }) {
  return (
    <Text variant="legenda" tone="textMuted" accessibilityRole="header" style={styles.section}>
      {title}
    </Text>
  );
}

function SoonRow({ label }: { label: string }) {
  const { t: tr } = useTranslation();
  const t = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${tr("add.soon")}`}
      accessibilityState={{ disabled: true }}
      style={[styles.soon, { borderColor: t.border }]}
    >
      <Text variant="corpo" tone="textMuted" style={styles.flex}>
        {label}
      </Text>
      <Tag label={tr("add.soon")} />
    </View>
  );
}

export function ProfileView(p: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const chip = (on: boolean) => ({
    backgroundColor: on ? t.primary : t.surface,
    borderColor: on ? t.primary : t.border,
  });
  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("profile.back")}
          onPress={p.onBack}
          style={[styles.back, { borderColor: t.border, backgroundColor: t.surface }]}
        >
          <Icon icon={ChevronLeft} size={20} strokeWidth={2.2} />
        </Pressable>
        <Text variant="titulo" accessibilityRole="header" style={styles.title}>
          {tr("profile.title")}
        </Text>
        <View style={styles.spacer} />
      </View>

      <Card style={styles.account}>
        <View style={[styles.avatar, { backgroundColor: t.tint }]}>
          <Text variant="subtitulo" tone="onTint" style={styles.avatarText}>
            ?
          </Text>
        </View>
        <View style={styles.flex}>
          <Text variant="subtitulo">{tr("profile.guest")}</Text>
          <Text variant="label" tone="textMuted" style={styles.hint}>
            {tr("profile.guestHint")}
          </Text>
        </View>
      </Card>

      <View style={[styles.stat, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Num size={28}>{p.retainedCount}</Num>
        <Text variant="label" tone="textMuted">
          {tr("profile.retainedStat")}
        </Text>
      </View>

      <Section title={tr("profile.study")} />
      <View style={styles.group}>
        <Text variant="label">{tr("profile.minutes")}</Text>
        <View accessibilityRole="radiogroup" style={styles.row}>
          {MINUTE_OPTIONS.map((m) => {
            const on = m === p.minutes;
            return (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityLabel={tr("onboarding.minutesLabel", { count: m })}
                accessibilityState={{ selected: on }}
                onPress={() => p.onMinutes(m)}
                style={[styles.chip, chip(on)]}
              >
                <Num size={13} tone={on ? "onPrimary" : "text"} style={styles.chipNum}>
                  {m}
                </Num>
                <Text variant="label" tone={on ? "onPrimary" : "text"} style={styles.chipText}>
                  {" min"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <SoonRow label={tr(SOON_ROWS.memoryGoal)} />

      <View style={[styles.stepper, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Text variant="corpo" style={styles.flex}>
          {tr("profile.newCards")}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("profile.newCardsLess")}
          onPress={() => p.onNewCards(p.newCards - 1)}
          style={[styles.step, { backgroundColor: t.tint }]}
        >
          <Icon icon={Minus} size={18} color="onTint" />
        </Pressable>
        <Num size={18} style={styles.stepValue} accessibilityLabel={`${p.newCards}`}>
          {p.newCards}
        </Num>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("profile.newCardsMore")}
          onPress={() => p.onNewCards(p.newCards + 1)}
          style={[styles.step, { backgroundColor: t.tint }]}
        >
          <Icon icon={Plus} size={18} color="onTint" />
        </Pressable>
      </View>

      <View style={styles.group}>
        <Text variant="label">{tr("profile.offDays")}</Text>
        <Text variant="legenda" tone="textMuted">
          {tr("profile.offDaysHint")}
        </Text>
        <View style={styles.row}>
          {WEEKDAYS.map((d) => {
            const on = p.offWeekdays.includes(d);
            return (
              <Pressable
                key={d}
                accessibilityRole="checkbox"
                accessibilityLabel={tr(`profile.days.${d}`)}
                accessibilityState={{ checked: on }}
                onPress={() => p.onToggleWeekday(d)}
                style={[styles.day, chip(on)]}
              >
                <Text variant="label" tone={on ? "onPrimary" : "text"} style={styles.chipText}>
                  {tr(`profile.daysShort.${d}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Section title={tr("profile.reminders")} />
      <SoonRow label={tr(SOON_ROWS.reminder)} />

      <Section title={tr("profile.appearance")} />
      <View accessibilityRole="radiogroup" style={styles.row}>
        {THEMES.map((v) => {
          const on = v === p.theme;
          return (
            <Pressable
              key={v}
              accessibilityRole="radio"
              accessibilityLabel={tr(`profile.themes.${v}`)}
              accessibilityState={{ selected: on }}
              onPress={() => p.onTheme(v)}
              style={[styles.chip, chip(on)]}
            >
              <Text variant="label" tone={on ? "onPrimary" : "text"} style={styles.chipText}>
                {tr(`profile.themes.${v}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Section title={tr("profile.security")} />
      <SoonRow label={tr(SOON_ROWS.faceId)} />

      <Section title={tr("profile.help")} />
      <SoonRow label={tr(SOON_ROWS.feedback)} />
      <SoonRow label={tr(SOON_ROWS.report)} />
      <SoonRow label={tr(SOON_ROWS.rate)} />

      <Section title={tr("profile.account")} />
      <SoonRow label={tr(SOON_ROWS.sync)} />
      <SoonRow label={tr(SOON_ROWS.export)} />
      <SoonRow label={tr(SOON_ROWS.privacy)} />
      <SoonRow label={tr(SOON_ROWS.signOut)} />
      <SoonRow label={tr(SOON_ROWS.delete)} />

      <Text variant="legenda" tone="textMuted" style={styles.version}>
        {tr("profile.version", { version: p.version })}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 56, paddingHorizontal: space.xl, paddingBottom: 48, gap: space.md },
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
  account: { flexDirection: "row", alignItems: "center", gap: 14, padding: space.lg },
  avatar: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "800" },
  hint: { fontWeight: "400" },
  stat: { borderRadius: 18, borderWidth: 1, padding: space.lg, gap: 4, alignItems: "flex-start" },
  section: { fontWeight: "700", letterSpacing: 0.72, textTransform: "uppercase", marginTop: space.md },
  group: { gap: space.sm },
  row: { flexDirection: "row", gap: space.sm },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  chipNum: { lineHeight: 16 },
  chipText: { fontWeight: "700" },
  day: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    paddingLeft: space.lg,
    borderRadius: 18,
    borderWidth: 1,
  },
  step: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepValue: { minWidth: 28, textAlign: "center" },
  soon: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    borderRadius: 16,
    borderWidth: 1,
    opacity: 0.85,
  },
  version: { textAlign: "center", marginTop: space.lg },
});
