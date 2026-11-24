import { ArrowRight, Calendar, Pencil, X } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeOut, SlideInRight, SlideOutLeft } from "react-native-reanimated";

import type { IntervalPreview, Rating } from "@/domain/scheduling";
import { Button, Icon, Num, ProgressBar, Text } from "@/shared/ui";
import { radius, space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

import { ContentText } from "@/features/rich-content";

import { FlipCard } from "./FlipCard";

export interface ReviewCardView {
  readonly collectionName: string;
  readonly position: { current: number; total: number };
  readonly front: string;
  readonly back: string;
  readonly frontDoc?: string | null;
  readonly backDoc?: string | null;
  readonly isRetry: boolean;
}

type Props = {
  card: ReviewCardView;
  intervals?: IntervalPreview | null;
  phase: "front" | "back";
  elapsedRatio: number;
  remainingLabel: string;
  onClose: () => void;
  onEdit?: () => void;
  onReveal: () => void;
  onGrade: (rating: Rating) => void;
};

const GRADES: { rating: Rating; key: "again" | "hard" | "good" | "easy" }[] = [
  { rating: 1, key: "again" },
  { rating: 2, key: "hard" },
  { rating: 3, key: "good" },
  { rating: 4, key: "easy" },
];

export function ReviewView({
  card,
  phase,
  intervals,
  elapsedRatio,
  remainingLabel,
  onClose,
  onEdit,
  onReveal,
  onGrade,
}: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const revealed = phase === "back";
  const [selection, setSelection] = useState<{ key: string; rating: Rating }>({ key: "", rating: 3 });
  const cardKey = `${card.position.current}-${card.isRetry ? "r" : "n"}`;
  const rating: Rating = selection.key === cardKey ? selection.rating : 3;
  const returnsIn = intervals ? intervals[rating] : null;
  const face = [styles.card, { backgroundColor: t.surface, borderColor: t.border }];
  const chips = (
    <View style={styles.chips}>
      <View style={[styles.chip, { backgroundColor: t.tint }]}>
        <Text variant="legenda" tone="onTint" style={styles.chipText}>
          {card.collectionName}
        </Text>
      </View>
      <View style={[styles.chip, { backgroundColor: t.surfaceMuted }]}>
        <Text variant="legenda" tone="textMuted" style={styles.chipText}>
          {tr("review.position", card.position)}
        </Text>
      </View>
    </View>
  );
  return (
    <View style={[styles.screen, { backgroundColor: t.background }]}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("review.close")}
          onPress={onClose}
          style={[styles.close, { borderColor: t.border, backgroundColor: t.surface }]}
        >
          <Icon icon={X} size={20} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.bar}>
          <ProgressBar value={elapsedRatio} track="border" accessibilityLabel={tr("review.timeLeft")} />
        </View>
        <View style={[styles.time, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Num size={13} style={styles.timeNum}>
            {remainingLabel}
          </Num>
        </View>
        {onEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr("review.edit")}
            onPress={onEdit}
            style={[styles.close, { borderColor: t.border, backgroundColor: t.surface }]}
          >
            <Icon icon={Pencil} size={18} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.stage}>
        <Animated.View
          key={cardKey}
          style={StyleSheet.absoluteFill}
          entering={SlideInRight.duration(320).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutLeft.duration(240)}
        >
          <FlipCard
            flipped={revealed}
            front={
              <View style={face}>
                {chips}
                <ScrollView contentContainerStyle={styles.body}>
                  <View accessibilityRole="header">
                    <ContentText doc={card.frontDoc ?? null} fallback={card.front} variant="pergunta" />
                  </View>
                </ScrollView>
                {card.isRetry ? (
                  <Text variant="legenda" tone="textMuted">
                    {tr("review.retryNote")}
                  </Text>
                ) : null}
              </View>
            }
            back={
              <View style={face}>
                {chips}
                <ScrollView contentContainerStyle={styles.body}>
                  <Text variant="label" tone="textMuted" numberOfLines={3}>
                    {card.front}
                  </Text>
                  <View style={[styles.rule, { backgroundColor: t.border }]} />
                  <Text variant="legenda" tone="textMuted" style={styles.kicker}>
                    {tr("review.correctAnswer")}
                  </Text>
                  <ContentText
                    doc={card.backDoc ?? null}
                    fallback={card.back}
                    variant="subtitulo"
                    style={styles.answer}
                  />
                  {returnsIn !== null && !card.isRetry ? (
                    <View style={[styles.returns, { backgroundColor: t.successTint }]}>
                      <Icon icon={Calendar} size={14} color="success" />
                      <Text variant="label" tone="success" style={styles.returnsText}>
                        {returnsIn === 0
                          ? tr("review.returnsToday")
                          : tr("review.returnsIn", { count: returnsIn })}
                      </Text>
                    </View>
                  ) : null}
                </ScrollView>
              </View>
            }
          />
        </Animated.View>
      </View>

      {revealed ? (
        <Animated.View entering={FadeInDown.duration(260)} style={styles.gradeArea}>
          <Text variant="legenda" tone="textMuted" style={styles.warning}>
            {tr("review.gradeWarning")}
          </Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={tr("review.grades.label")}
            style={[styles.grades, { backgroundColor: t.surface, borderColor: t.border }]}
          >
            {GRADES.map((g) => {
              const on = g.rating === rating;
              const again = g.rating === 1;
              return (
                <Pressable
                  key={g.key}
                  accessibilityRole="radio"
                  accessibilityLabel={tr(`review.grades.${g.key}`)}
                  accessibilityState={{ selected: on }}
                  onPress={() => setSelection({ key: cardKey, rating: g.rating })}
                  style={({ pressed }) => [
                    styles.grade,
                    on && { backgroundColor: again ? t.dangerTint : t.primary },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    variant="label"
                    tone={on ? (again ? "danger" : "onPrimary") : "text"}
                    style={styles.gradeText}
                  >
                    {tr(`review.grades.${g.key}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Button
            label={tr("review.next")}
            onPress={() => onGrade(rating)}
            trailing={<Icon icon={ArrowRight} size={20} color="onButton" strokeWidth={2.2} />}
          />
        </Animated.View>
      ) : (
        <Animated.View exiting={FadeOut.duration(120)}>
          <Button
            label={tr("review.show")}
            onPress={onReveal}
            leading={<Icon icon={ArrowRight} size={20} color="onButton" strokeWidth={2.2} />}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 56, paddingHorizontal: space.xl, paddingBottom: 28, gap: space.lg },
  top: { flexDirection: "row", alignItems: "center", gap: space.md },
  close: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bar: { flex: 1 },
  time: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 1 },
  timeNum: { fontWeight: "600", lineHeight: 16 },
  flex: { flex: 1 },
  stage: { flex: 1, overflow: "hidden" },
  card: { flex: 1, borderRadius: radius.xl, borderWidth: 1, padding: space["2xl"], gap: 18 },
  chips: { flexDirection: "row", gap: space.sm },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill },
  chipText: { fontWeight: "700" },
  body: { flexGrow: 1, justifyContent: "center", gap: space.lg },
  rule: { height: 1 },
  kicker: { fontWeight: "700", letterSpacing: 0.72, textTransform: "uppercase" },
  answer: { fontSize: 21, lineHeight: 27, fontWeight: "700" },
  gradeArea: { gap: space.md },
  returns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  returnsText: { fontWeight: "700" },
  grades: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 18, borderWidth: 1 },
  grade: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  gradeText: { fontWeight: "700" },
  warning: { textAlign: "center" },
});
