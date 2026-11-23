import { ArrowRight, Calendar, Check, RotateCcw, Send, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Pressable, StyleSheet, TextInput, View } from "react-native";

import type { Rating } from "@/domain/scheduling";
import { Button, Icon, Num, Text } from "@/shared/ui";
import { fonts, radius, space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

export type ReviewViewModel = {
  phase: "answering" | "result" | "summary";
  front: string;
  back: string;
  position: number;
  total: number;
  timeLeftRatio: number;
  timeLeftLabel: string;
  answer: string;
  rating: Rating;
  seconds: number;
  skipped: boolean;
  intervalDays: number;
  isLast: boolean;
  reviewed: number;
  hits: number;
  elapsedLabel: string;
};

type Props = {
  model: ReviewViewModel;
  onChangeAnswer: (text: string) => void;
  onSubmit: () => void;
  onGiveUp: () => void;
  onAdjust: (rating: Rating) => void;
  onNext: () => void;
  onClose: () => void;
};

const RATINGS: readonly Rating[] = [1, 2, 3, 4];

function TopBar({ model, onClose }: { model: ReviewViewModel; onClose: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const pct = Math.round(Math.min(1, Math.max(0, model.timeLeftRatio)) * 100);
  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr("review.close")}
        onPress={onClose}
        style={[styles.close, { backgroundColor: t.surface, borderColor: t.border }]}
      >
        <Icon icon={X} size={18} strokeWidth={2.4} />
      </Pressable>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={tr("review.timer")}
        accessibilityValue={{ min: 0, max: 100, now: pct }}
        style={[styles.track, { backgroundColor: t.border }]}
      >
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: t.button }]} />
      </View>
      <View style={[styles.clock, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Num size={13} style={styles.clockNum}>
          {model.timeLeftLabel}
        </Num>
      </View>
    </View>
  );
}

function Answering({ model, onChangeAnswer, onSubmit, onGiveUp }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const canSend = model.answer.trim().length > 0;
  return (
    <>
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={[styles.counter, { backgroundColor: t.surfaceMuted }]}>
          <Text variant="legenda" tone="textMuted" style={styles.bold}>
            {tr("review.cardOf", { current: model.position, total: model.total })}
          </Text>
        </View>
        <View style={styles.questionWrap}>
          <Text variant="pergunta">{model.front}</Text>
        </View>
        <Text variant="legenda" tone="textMuted">
          {tr("review.hint")}
        </Text>
      </View>
      <View style={[styles.answerBox, { backgroundColor: t.surface, borderColor: t.button }]}>
        <TextInput
          accessibilityLabel={tr("review.answerLabel")}
          value={model.answer}
          onChangeText={onChangeAnswer}
          onSubmitEditing={canSend ? onSubmit : undefined}
          returnKeyType="send"
          autoFocus
          placeholderTextColor={t.textMuted}
          style={[styles.answerInput, { color: t.text }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("review.send")}
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={onSubmit}
          style={[styles.send, { backgroundColor: t.button, opacity: canSend ? 1 : 0.5 }]}
        >
          <Icon icon={Send} size={20} color="onButton" strokeWidth={2.4} />
        </Pressable>
      </View>
      <Pressable accessibilityRole="link" accessibilityLabel={tr("review.giveUp")} onPress={onGiveUp}>
        <Text variant="label" tone="textMuted" style={styles.center}>
          {tr("review.giveUp")}
        </Text>
      </Pressable>
    </>
  );
}

function Result({ model, onAdjust, onNext }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const good = model.rating >= 3;
  return (
    <>
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.verdictRow}>
          <View style={[styles.verdictIcon, { backgroundColor: good ? t.success : t.danger }]}>
            <Icon icon={good ? Check : RotateCcw} size={26} color="onPrimary" strokeWidth={3} />
          </View>
          <View style={styles.flex}>
            <Text variant="subtitulo" style={styles.verdict}>
              {tr(`review.verdict.${model.rating}`)}
            </Text>
            <Text variant="legenda" tone="textMuted">
              {model.skipped
                ? tr("review.skippedSub")
                : tr(`review.verdictSub.${model.rating}`, { seconds: Math.round(model.seconds) })}
            </Text>
          </View>
        </View>
        <View style={[styles.rule, { backgroundColor: t.border }]} />
        <Text variant="legenda" tone="textMuted" style={styles.overline}>
          {tr("review.answer")}
        </Text>
        <Text variant="pergunta" style={styles.backText}>
          {model.back}
        </Text>
        <View style={styles.flex} />
        <View
          style={[styles.returns, { backgroundColor: good ? t.successTint : t.tint }]}
          accessible
          accessibilityLabel={tr("review.returnsIn", { count: model.intervalDays })}
        >
          <Icon icon={Calendar} size={16} color={good ? "success" : "onTint"} />
          <Text variant="label" tone={good ? "success" : "onTint"} style={styles.bold}>
            {tr("review.returnsIn", { count: model.intervalDays })}
          </Text>
        </View>
      </View>
      <Text variant="legenda" tone="textMuted" style={styles.center}>
        {tr("review.adjust")}
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={tr("review.grade")}
        style={[styles.segment, { backgroundColor: t.surface, borderColor: t.border }]}
      >
        {RATINGS.map((r) => {
          const on = model.rating === r;
          return (
            <Pressable
              key={r}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={tr(`review.ratings.${r}`)}
              onPress={() => onAdjust(r)}
              style={[styles.segmentItem, on && { backgroundColor: t.primary }]}
            >
              <Text variant="label" tone={on ? "onPrimary" : "text"} style={on ? styles.heavy : styles.semi}>
                {tr(`review.ratings.${r}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={model.isLast ? tr("review.finish") : tr("review.next")}
        onPress={onNext}
        style={[styles.next, { backgroundColor: t.button }]}
      >
        <Text variant="subtitulo" tone="onButton">
          {model.isLast ? tr("review.finish") : tr("review.next")}
        </Text>
        <Icon icon={ArrowRight} size={20} color="onButton" strokeWidth={2.4} />
      </Pressable>
    </>
  );
}

function Summary({ model, onClose }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const empty = model.reviewed === 0;
  return (
    <>
      <View style={[styles.hero, { backgroundColor: t.hero }]}>
        <Text variant="titulo" tone="onHero">
          {empty ? tr("review.summaryEmpty") : tr("review.summaryTitle")}
        </Text>
        {empty ? null : (
          <>
            <Num size={64} tone="onHero">
              {model.reviewed}
            </Num>
            <Text variant="corpo" tone="onHeroMuted">
              {tr("review.summaryReviewed", { count: model.reviewed })}
            </Text>
            <View style={styles.heroStats}>
              <Text variant="label" tone="onHero">
                {tr("review.summaryHits", { count: model.hits })}
              </Text>
              <Text variant="label" tone="onHeroMuted">
                {tr("review.summaryMinutes", { value: model.elapsedLabel })}
              </Text>
            </View>
          </>
        )}
      </View>
      <View style={styles.flex} />
      <Button label={tr("review.done")} onPress={onClose} />
    </>
  );
}

export function ReviewView(props: Props) {
  const t = useTheme();
  const { model } = props;
  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.screen, { backgroundColor: t.background }]}>
      {model.phase === "summary" ? null : <TopBar model={model} onClose={props.onClose} />}
      {model.phase === "answering" ? <Answering {...props} /> : null}
      {model.phase === "result" ? <Result {...props} /> : null}
      {model.phase === "summary" ? <Summary {...props} /> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 56, paddingHorizontal: space.xl, paddingBottom: 28, gap: 16 },
  flex: { flex: 1 },
  center: { textAlign: "center" },
  bold: { fontWeight: "700" },
  semi: { fontWeight: "600" },
  heavy: { fontWeight: "800" },
  topBar: { flexDirection: "row", alignItems: "center", gap: space.md },
  close: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  track: { flex: 1, height: 8, borderRadius: radius.pill, overflow: "hidden" },
  fill: { height: 8, borderRadius: radius.pill },
  clock: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 1 },
  clockNum: { fontFamily: fonts.numbers.semibold, lineHeight: 16 },
  card: { flex: 1, borderRadius: radius.xl, borderWidth: 1, padding: space.xl, gap: 16 },
  counter: { alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill },
  questionWrap: { flex: 1, justifyContent: "center" },
  answerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingVertical: 8,
    paddingLeft: 18,
    paddingRight: 8,
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  answerInput: { flex: 1, minWidth: 0, fontFamily: fonts.text.regular, fontSize: 15, padding: 0, height: 44 },
  send: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  verdictRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  verdictIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  verdict: { fontSize: 20, fontWeight: "800" },
  rule: { height: 1 },
  overline: { fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.7 },
  backText: { fontSize: 21, lineHeight: 27 },
  returns: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: radius.pill,
  },
  segment: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 18, borderWidth: 1 },
  segmentItem: { flex: 1, paddingVertical: 11, borderRadius: 14, alignItems: "center" },
  next: {
    borderRadius: radius.lg,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  hero: { borderRadius: radius.xl, padding: space.xl, gap: space.md },
  heroStats: { flexDirection: "row", gap: space.lg },
});
