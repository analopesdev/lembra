import { Bell, Calendar, ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { MINUTE_OPTIONS, type DailyMinutes } from "@/domain/settings/settings";
import { Button, Icon, LogoMark, Num, Tag, Text, Toggle } from "@/shared/ui";
import { fonts, radius, space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

type Props = {
  minutes: DailyMinutes;
  onMinutes: (v: DailyMinutes) => void;
  busy?: boolean;
  onStart: () => void;
  onSkip: () => void;
  onBack?: () => void;
};

export function SettingsView({ minutes, onMinutes, busy, onStart, onSkip, onBack }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr("onboarding.back")}
            onPress={onBack}
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("onboarding.skip")}
          onPress={onSkip}
          disabled={busy}
          style={styles.skip}
        >
          <Text variant="subtitulo" tone="link" style={styles.skipText}>
            {tr("onboarding.skip")}
          </Text>
        </Pressable>
      </View>

      <View style={styles.intro}>
        <LogoMark />
        <Text style={styles.headline}>{tr("onboarding.headline")}</Text>
        <Text variant="corpo" tone="textMuted">
          {tr("onboarding.lead")}
        </Text>
      </View>

      <View accessibilityRole="radiogroup" style={styles.row}>
        {MINUTE_OPTIONS.map((m) => {
          const on = m === minutes;
          return (
            <Pressable
              key={m}
              accessibilityRole="radio"
              accessibilityLabel={tr("onboarding.minutesLabel", { count: m })}
              accessibilityState={{ selected: on }}
              onPress={() => onMinutes(m)}
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
        <Toggle value={false} onValueChange={() => undefined} label={tr("onboarding.reminder")} disabled />
      </View>

      <View style={[styles.tip, { backgroundColor: t.surfaceMuted, borderColor: t.border }]}>
        <Icon icon={Calendar} size={22} color="link" />
        <Text variant="label" tone="textMuted" style={styles.tipText}>
          {tr("onboarding.examTip")}
        </Text>
      </View>

      <View style={styles.flex} />
      <Button label={tr("onboarding.start")} onPress={onStart} loading={busy} />
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
  tipText: { flex: 1, fontWeight: "400", lineHeight: 19 },
});
