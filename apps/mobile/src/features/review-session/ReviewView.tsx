import { ArrowRight, Pencil, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeOut, SlideInRight, SlideOutLeft } from "react-native-reanimated";

import type { Rating } from "@/domain/scheduling";
import { Button, Icon, Num, ProgressBar, Text } from "@/shared/ui";
import { radius, space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

import { FlipCard } from "./FlipCard";

export interface ReviewCardView {
  readonly collectionName: string;
  readonly position: { current: number; total: number };
  readonly front: string;
  readonly back: string;
  readonly isRetry: boolean;
}

type Props = {
  card: ReviewCardView;
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
  const cardKey = `${card.position.current}-${card.isRetry ? "r" : "n"}`;
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
                  <Text variant="pergunta" accessibilityRole="header">
                    {card.front}
                  </Text>
                </ScrollView>
                {card.isRetry ? (
                  <Text variant="legenda" tone="textMuted">
                    {tr("review.retryNote")}
                  </Text>
                ) : null}
              </View>
            }
            back={
              <View style={[face, { backgroundColor: t.tint, borderColor: t.tint }]}>
                {chips}
                <ScrollView contentContainerStyle={styles.body}>
                  <Text variant="legenda" tone="onTint" style={styles.kicker}>
                    {tr("review.answer")}
                  </Text>
                  <Text variant="subtitulo" tone="onTint" style={styles.answer}>
                    {card.back}
                  </Text>
                </ScrollView>
              </View>
            }
          />
        </Animated.View>
      </View>

      {revealed ? (
        <Animated.View entering={FadeInDown.duration(260)} style={styles.gradeArea}>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={tr("review.grades.label")}
            style={[styles.grades, { backgroundColor: t.surface, borderColor: t.border }]}
          >
            {GRADES.map((g) => (
              <Pressable
                key={g.key}
                accessibilityRole="button"
                accessibilityLabel={tr(`review.grades.${g.key}`)}
                onPress={() => onGrade(g.rating)}
                style={({ pressed }) => [
                  styles.grade,
                  g.rating === 1 && { backgroundColor: t.dangerTint },
                  pressed && { transform: [{ scale: 0.95 }], opacity: 0.85 },
                ]}
              >
                <Text variant="label" tone={g.rating === 1 ? "danger" : "text"} style={styles.gradeText}>
                  {tr(`review.grades.${g.key}`)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text variant="legenda" tone="textMuted" style={styles.warning}>
            {tr("review.gradeWarning")}
          </Text>
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
  gradeArea: { gap: space.sm },
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
