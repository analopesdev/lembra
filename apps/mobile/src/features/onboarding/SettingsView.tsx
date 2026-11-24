import { Bell, Calendar, ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { MINUTE_OPTIONS, type DailyMinutes } from "@/domain/settings/settings";
import { Button, Icon, Input, Num, Tag, Text, Toggle } from "@/shared/ui";
import { fonts, radius, space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

export type SettingsStep = 0 | 1 | 2;

type Props = {
  step: SettingsStep;
  minutes: DailyMinutes;
  onMinutes: (v: DailyMinutes) => void;
  offWeekdays: readonly number[];
  onToggleWeekday: (day: number) => void;
  goal: string;
  onGoal: (v: string) => void;
  pledge: string;
  busy?: boolean;
  onNext: () => void;
  onSkip: () => void;
  onBack?: () => void;
};

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

export function SettingsView(p: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const head =
    p.step === 0
      ? { title: tr("onboarding.headline"), lead: tr("onboarding.lead") }
      : p.step === 1
        ? { title: tr("onboarding.restTitle"), lead: tr("onboarding.restLead") }
        : { title: tr("onboarding.goalTitle"), lead: tr("onboarding.goalLead") };
  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        {p.onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr("onboarding.back")}
            onPress={p.onBack}
            style={[styles.back, { borderColor: t.border, backgroundColor: t.surface }]}
          >
            <Icon icon={ChevronLeft} size={20} strokeWidth={2.2} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <Text variant="titulo" accessibilityRole="header" style={styles.title}>
          {tr("onboarding.title")}
        </Text>
        {p.step === 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr("onboarding.skip")}
            onPress={p.onSkip}
            disabled={p.busy}
            style={styles.skip}
          >
            <Text variant="subtitulo" tone="link" style={styles.skipText}>
              {tr("onboarding.skip")}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.skip} />
        )}
      </View>

      <View style={styles.intro}>
        <Text accessibilityRole="header" style={styles.headline}>
          {head.title}
        </Text>
        <Text variant="corpo" tone="textMuted">
          {head.lead}
        </Text>
      </View>

      {p.step === 0 ? (
        <>
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
                  style={[
                    styles.chip,
                    { backgroundColor: on ? t.primary : t.surface, borderColor: on ? t.primary : t.border },
                  ]}
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

          <View style={[styles.reminder, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.reminderIcon, { backgroundColor: t.tint }]}>
              <Icon icon={Bell} size={22} color="onTint" />
            </View>
            <View style={styles.flex}>
              <Text variant="subtitulo" style={styles.reminderTitle}>
                {tr("onboarding.reminder")}
              </Text>
              <Text variant="label" tone="textMuted" style={styles.reminderSub}>
                {tr("onboarding.reminderAt", { time: "19:30" })}
              </Text>
            </View>
            <Tag label={tr("add.soon")} />
            <Toggle
              value={false}
              onValueChange={() => undefined}
              label={tr("onboarding.reminder")}
              disabled
            />
          </View>

          <View style={[styles.tip, { backgroundColor: t.surfaceMuted, borderColor: t.border }]}>
            <Icon icon={Calendar} size={22} color="link" />
            <Text variant="label" tone="textMuted" style={styles.tipText}>
              {tr("onboarding.examTip")}
            </Text>
          </View>
        </>
      ) : null}

      {p.step === 1 ? (
        <>
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
                  style={styles.dayCell}
                >
                  <View
                    style={[
                      styles.day,
                      on
                        ? { backgroundColor: t.primary }
                        : { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1 },
                    ]}
                  >
                    <Text variant="subtitulo" tone={on ? "onPrimary" : "text"} style={styles.dayText}>
                      {tr(`profile.daysShort.${d}`)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={[styles.tip, { backgroundColor: t.surfaceMuted, borderColor: t.border }]}>
            <Text variant="label" tone="textMuted" style={styles.tipText}>
              {tr("onboarding.restNote")}
            </Text>
          </View>
        </>
      ) : null}

      {p.step === 2 ? (
        <>
          <Input
            label={tr("onboarding.goalLabel")}
            value={p.goal}
            onChangeText={p.onGoal}
            placeholder={tr("onboarding.goalPlaceholder")}
            minLines={3}
            maxLength={200}
          />
          <View style={[styles.pledge, { backgroundColor: t.tint }]}>
            <Text variant="label" tone="onTint" style={styles.pledgeTitle}>
              {tr("onboarding.pledgeTitle")}
            </Text>
            <Text variant="corpo" tone="onTint">
              {p.pledge}
            </Text>
          </View>
        </>
      ) : null}

      <View style={styles.flex} />
      <Button
        label={p.step === 2 ? tr("onboarding.commit") : tr("onboarding.next")}
        onPress={p.onNext}
        loading={p.busy}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 56, paddingHorizontal: space.xl, paddingBottom: 32, gap: space["2xl"] },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: space.md },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, textAlign: "center", fontSize: 20 },
  skip: { minWidth: 40, minHeight: 44, alignItems: "flex-end", justifyContent: "center" },
  skipText: { fontSize: 15 },
  intro: { gap: 10 },
  headline: { fontFamily: fonts.text.extrabold, fontSize: 32, lineHeight: 37, letterSpacing: -0.8 },
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
    paddingHorizontal: 14,
  },
  chipNum: { lineHeight: 16 },
  chipText: { fontWeight: "700" },
  reminder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  reminderIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  reminderTitle: { fontSize: 15 },
  reminderSub: { fontWeight: "400" },
  tip: { flexDirection: "row", gap: space.md, padding: space.lg, borderRadius: 18, borderWidth: 1 },
  dayCell: { flex: 1, alignItems: "center" },
  day: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  dayText: { fontSize: 15, fontWeight: "700" },
  pledge: { gap: 10, padding: space.lg, borderRadius: radius.lg },
  pledgeTitle: { fontWeight: "700" },
  tipText: { flex: 1, fontWeight: "400", lineHeight: 19 },
});
