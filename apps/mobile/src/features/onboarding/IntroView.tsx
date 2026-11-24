import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { Button, Text } from "@/shared/ui";
import { fonts, space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

import { MaterialToCardsArt, MemoryCurveArt, MinutesArt } from "./IntroArt";

export type IntroStep = 1 | 2 | 3;

type Props = { step: IntroStep; onNext: () => void; onSkip: () => void };

const ART = { 1: MemoryCurveArt, 2: MaterialToCardsArt, 3: MinutesArt } as const;

export function IntroView({ step, onNext, onSkip }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const Art = ART[step];
  const last = step === 3;
  return (
    <View style={[styles.screen, { backgroundColor: t.introBg }]}>
      <View style={styles.top}>
        <View
          accessible
          accessibilityRole="tablist"
          accessibilityLabel={tr("intro.progress", { step })}
          style={styles.dots}
        >
          {[1, 2, 3].map((n) => (
            <View
              key={n}
              style={[
                styles.dot,
                n === step
                  ? { width: 24, backgroundColor: t.accent }
                  : { width: 8, backgroundColor: t.introDeco },
              ]}
            />
          ))}
        </View>
        {last ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr("intro.skip")}
            onPress={onSkip}
            style={styles.skip}
          >
            <Text variant="subtitulo" tone="onHero" style={styles.skipText}>
              {tr("intro.skip")}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.art}>
        <Art />
      </View>

      <Text accessibilityRole="header" tone="onHero" style={styles.title}>
        {tr(`intro.s${step}.title`)}
      </Text>
      <Text variant="corpo" style={[styles.lead, { color: t.introMuted }]}>
        {tr(`intro.s${step}.text`)}
      </Text>
      <Button label={last ? tr("intro.start") : tr("intro.next")} onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 60, paddingHorizontal: 24, paddingBottom: 34 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 40 },
  dots: { flexDirection: "row", gap: 6 },
  dot: { height: 8, borderRadius: 99 },
  skip: { minHeight: 44, justifyContent: "center", paddingLeft: space.lg },
  skipText: { fontSize: 15 },
  art: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.text.extrabold, fontSize: 38, lineHeight: 40, letterSpacing: -1.33 },
  lead: { fontSize: 16, lineHeight: 24, marginTop: 14, marginBottom: 32 },
});
