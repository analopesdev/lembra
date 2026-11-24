import {
  Bell,
  Bug,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crosshair,
  Download,
  LogOut,
  MessageSquareText,
  Minus,
  Pause,
  Plus,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  Star,
  Target,
  type LucideIcon,
} from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import {
  AVATAR_SEEDS,
  MINUTE_OPTIONS,
  type DailyMinutes,
  type ThemePreference,
} from "@/domain/settings/settings";
import { Avatar, Icon, Num, Sheet, Text, Toggle } from "@/shared/ui";
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
  glassNav: boolean;
  onGlassNav: (v: boolean) => void;
  avatarSeed: string;
  onAvatarSeed: (seed: string) => void;
  retainedCount: number;
  streakDays: number | null;
  version: string;
  backup: {
    busy: boolean;
    message: string | null;
    onExportJson: () => void;
    onExportCsv: () => void;
    onImport: () => void;
  };
  onBack: () => void;
};

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
const THEMES: ThemePreference[] = ["light", "dark", "auto"];

type RowProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  value?: React.ReactNode;
  last?: boolean;
  onPress?: () => void;
  soon?: boolean;
  trailing?: React.ReactNode;
  label?: string;
};

function Group({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.group, { backgroundColor: t.surface, borderColor: t.border }]}>{children}</View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="legenda" tone="textMuted" accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ icon, title, subtitle, value, last, onPress, soon, trailing, label }: RowProps) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const body = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: t.tint }]}>
        <Icon icon={icon} size={18} color="onTint" />
      </View>
      <View style={styles.flex}>
        <Text variant="corpo" style={styles.rowTitle}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="label" tone="textMuted" style={styles.rowSub}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="label" tone="textMuted" style={styles.rowValue}>
          {value}
        </Text>
      ) : null}
      {trailing ?? <Icon icon={ChevronRight} size={18} color="textMuted" />}
    </>
  );
  const frame = [styles.row, !last && { borderBottomWidth: 1, borderBottomColor: t.border }];
  if (soon) {
    return (
      <View
        accessible
        accessibilityLabel={`${title}, ${tr("add.soon")}`}
        accessibilityState={{ disabled: true }}
        style={[frame, styles.soonRow]}
      >
        {body}
      </View>
    );
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label ?? title} onPress={onPress} style={frame}>
      {body}
    </Pressable>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
  last,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <Row
      icon={icon}
      title={title}
      subtitle={subtitle}
      last={last}
      onPress={() => onChange(!value)}
      label={title}
      trailing={<Toggle value={value} onValueChange={onChange} label={title} />}
    />
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
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

export function ProfileView(p: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  type Panel = "avatar" | "minutes" | "newCards" | "offDays" | "backup" | null;
  const [panel, setPanel] = useState<Panel>(null);
  const close = () => setPanel(null);
  const chip = (on: boolean) => ({
    backgroundColor: on ? t.primary : t.surface,
    borderColor: on ? t.primary : t.border,
  });
  const offValue =
    p.offWeekdays.length === 0
      ? tr("profile.noOffDays")
      : p.offWeekdays.length === 1
        ? tr(`profile.days.${p.offWeekdays[0]}`)
        : tr("profile.offDaysCount", { count: p.offWeekdays.length });
  const selectedSeed = p.avatarSeed === "" ? AVATAR_SEEDS[0] : p.avatarSeed;
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

      <View style={styles.account}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("profile.avatarChange")}
          onPress={() => setPanel("avatar")}
        >
          <Avatar seed={p.avatarSeed} size={64} />
        </Pressable>
        <View style={styles.flex}>
          <Text variant="titulo" style={styles.name}>
            {tr("profile.guest")}
          </Text>
          <Text variant="label" tone="textMuted">
            {tr("profile.guestHint")}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat value={p.streakDays ?? "—"} label={tr("profile.streakStat")} />
        <Stat value={p.retainedCount} label={tr("profile.retainedStat")} />
        <Stat value={p.offWeekdays.length} label={tr("profile.freeDaysStat")} />
      </View>

      <Section title={tr("profile.study")}>
        <Group>
          <Row
            icon={Clock}
            title={tr("profile.minutes")}
            value={tr("profile.minutesValue", { count: p.minutes })}
            onPress={() => setPanel("minutes")}
          />
          <Row
            icon={Target}
            title={tr("profile.memoryGoal")}
            subtitle={tr("profile.memoryGoalHint")}
            value="90%"
            soon
          />
          <Row
            icon={Crosshair}
            title={tr("profile.newCards")}
            value={p.newCards}
            onPress={() => setPanel("newCards")}
          />
          <Row
            icon={Pause}
            title={tr("profile.offDays")}
            value={offValue}
            last
            onPress={() => setPanel("offDays")}
          />
        </Group>
      </Section>

      <Section title={tr("profile.reminders")}>
        <Group>
          <Row
            icon={Bell}
            title={tr("profile.dailyReminder")}
            subtitle={tr("profile.reminderSub")}
            last
            soon
          />
        </Group>
      </Section>

      <Section title={tr("profile.appearance")}>
        <View accessibilityRole="radiogroup" style={[styles.segment, { backgroundColor: t.border }]}>
          {THEMES.map((v) => {
            const on = v === p.theme;
            return (
              <Pressable
                key={v}
                accessibilityRole="radio"
                accessibilityLabel={tr(`profile.themes.${v}`)}
                accessibilityState={{ selected: on }}
                onPress={() => p.onTheme(v)}
                style={[styles.segmentBtn, on && { backgroundColor: t.surface }]}
              >
                <Text variant="label" tone={on ? "text" : "textMuted"} style={styles.segmentText}>
                  {tr(`profile.themes.${v}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Group>
          <ToggleRow
            icon={Star}
            title={tr("profile.glassNav")}
            value={p.glassNav}
            onChange={p.onGlassNav}
            last
          />
        </Group>
      </Section>

      <Section title={tr("profile.security")}>
        <Group>
          <Row icon={ScanFace} title={tr("profile.faceId")} subtitle={tr("profile.faceIdSub")} last soon />
        </Group>
      </Section>

      <Section title={tr("profile.help")}>
        <Group>
          <Row
            icon={MessageSquareText}
            title={tr("profile.feedback")}
            subtitle={tr("profile.feedbackSub")}
            soon
          />
          <Row icon={Bug} title={tr("profile.reportProblem")} soon />
          <Row icon={Star} title={tr("profile.rate")} last soon />
        </Group>
      </Section>

      <Section title={tr("profile.account")}>
        <Group>
          <Row icon={RefreshCw} title={tr("profile.sync")} subtitle={tr("profile.syncSub")} soon />
          <Row
            icon={Download}
            title={tr("profile.export")}
            subtitle={tr("profile.exportSub")}
            onPress={() => setPanel("backup")}
          />
          <Row icon={ShieldCheck} title={tr("profile.privacy")} last soon />
        </Group>
      </Section>

      <View
        accessible
        accessibilityLabel={`${tr("profile.signOut")}, ${tr("add.soon")}`}
        accessibilityState={{ disabled: true }}
        style={[styles.signOut, { borderColor: t.border, backgroundColor: t.surface }]}
      >
        <Icon icon={LogOut} size={18} />
        <Text variant="corpo" style={styles.signOutText}>
          {tr("profile.signOut")}
        </Text>
      </View>
      <View
        accessible
        accessibilityLabel={`${tr("profile.deleteAccount")}, ${tr("add.soon")}`}
        accessibilityState={{ disabled: true }}
        style={styles.delete}
      >
        <Text variant="corpo" style={[styles.deleteText, { color: t.danger }]}>
          {tr("profile.deleteAccount")}
        </Text>
      </View>
      <Text variant="legenda" tone="textMuted" style={styles.version}>
        {tr("profile.version", { version: p.version })}
      </Text>

      <Sheet visible={panel === "avatar"} onClose={close} closeLabel={tr("profile.avatarClose")}>
        <Text variant="subtitulo">{tr("profile.avatarPick")}</Text>
        <View accessibilityRole="radiogroup" style={styles.avatarGrid}>
          {AVATAR_SEEDS.map((seed, i) => {
            const on = seed === selectedSeed;
            return (
              <Pressable
                key={seed}
                accessibilityRole="radio"
                accessibilityLabel={tr("profile.avatarOption", { n: i + 1 })}
                accessibilityState={{ selected: on }}
                onPress={() => {
                  p.onAvatarSeed(seed);
                  close();
                }}
                style={[styles.avatarOption, { borderColor: on ? t.primary : "transparent" }]}
              >
                <Avatar seed={seed} size={52} />
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      <Sheet visible={panel === "minutes"} onClose={close} closeLabel={tr("profile.avatarClose")}>
        <Text variant="subtitulo">{tr("profile.minutes")}</Text>
        <View accessibilityRole="radiogroup" style={styles.chips}>
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
                <Num size={13} tone={on ? "onPrimary" : "text"}>
                  {m}
                </Num>
                <Text variant="label" tone={on ? "onPrimary" : "text"} style={styles.chipText}>
                  {" min"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      <Sheet visible={panel === "newCards"} onClose={close} closeLabel={tr("profile.avatarClose")}>
        <Text variant="subtitulo">{tr("profile.newCards")}</Text>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr("profile.newCardsLess")}
            onPress={() => p.onNewCards(p.newCards - 1)}
            style={[styles.stepBtn, { borderColor: t.border, backgroundColor: t.surface }]}
          >
            <Icon icon={Minus} size={20} />
          </Pressable>
          <Num size={28}>{p.newCards}</Num>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr("profile.newCardsMore")}
            onPress={() => p.onNewCards(p.newCards + 1)}
            style={[styles.stepBtn, { borderColor: t.border, backgroundColor: t.surface }]}
          >
            <Icon icon={Plus} size={20} />
          </Pressable>
        </View>
      </Sheet>

      <Sheet visible={panel === "offDays"} onClose={close} closeLabel={tr("profile.avatarClose")}>
        <Text variant="subtitulo">{tr("profile.offDays")}</Text>
        <Text variant="label" tone="textMuted">
          {tr("profile.offDaysHint")}
        </Text>
        <View style={styles.chips}>
          {WEEKDAYS.map((d) => {
            const on = p.offWeekdays.includes(d);
            return (
              <Pressable
                key={d}
                accessibilityRole="checkbox"
                accessibilityLabel={tr(`profile.days.${d}`)}
                accessibilityState={{ checked: on }}
                onPress={() => p.onToggleWeekday(d)}
                style={[styles.dayChip, chip(on)]}
              >
                <Text variant="label" tone={on ? "onPrimary" : "text"} style={styles.chipText}>
                  {tr(`profile.daysShort.${d}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      <Sheet visible={panel === "backup"} onClose={close} closeLabel={tr("profile.avatarClose")}>
        <Text variant="subtitulo">{tr("profile.export")}</Text>
        <Group>
          <Row
            icon={Download}
            title={tr("backup.exportJson")}
            onPress={p.backup.busy ? undefined : p.backup.onExportJson}
          />
          <Row
            icon={Download}
            title={tr("backup.exportCsv")}
            onPress={p.backup.busy ? undefined : p.backup.onExportCsv}
          />
          <Row
            icon={Download}
            title={tr("backup.import")}
            last
            onPress={p.backup.busy ? undefined : p.backup.onImport}
          />
        </Group>
        {p.backup.message ? (
          <Text variant="label" tone="textMuted" accessibilityLiveRegion="polite">
            {p.backup.message}
          </Text>
        ) : null}
      </Sheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 40, gap: 24 },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
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
  account: { flexDirection: "row", alignItems: "center", gap: 14 },
  name: { fontSize: 20, fontWeight: "800" },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, gap: 2, padding: 14, borderRadius: 18, borderWidth: 1 },
  statLabel: { fontSize: 12, fontWeight: "600" },
  section: { gap: 8 },
  sectionTitle: {
    marginHorizontal: 4,
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
  },
  soonRow: { opacity: 0.6 },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 12 },
  rowValue: { fontSize: 14, fontWeight: "600" },
  segment: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 16 },
  segmentBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  segmentText: { fontSize: 13, fontWeight: "700" },
  signOut: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    opacity: 0.6,
  },
  signOutText: { fontSize: 15, fontWeight: "700" },
  delete: { padding: 12, alignItems: "center", opacity: 0.6 },
  deleteText: { fontSize: 15, fontWeight: "700" },
  version: { textAlign: "center", fontSize: 12 },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    justifyContent: "center",
  },
  avatarOption: { padding: 2, borderWidth: 2, borderRadius: 32 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontWeight: "700" },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xl },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
