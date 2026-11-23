import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Button, Card, Num, Text } from "@/shared/ui";
import { space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

export interface SessionSummaryView {
  reviewed: number;
  hits: number;
  retries: number;
  memoryBefore: number;
  memoryAfter: number;
}

type Props = { summary: SessionSummaryView; onBack: () => void };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Num size={32}>{value}</Num>
      <Text variant="label" tone="textMuted">
        {label}
      </Text>
    </View>
  );
}

export function SummaryView({ summary, onBack }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const delta = summary.memoryAfter - summary.memoryBefore;
  return (
    <View style={[styles.screen, { backgroundColor: t.background }]}>
      <Text variant="titulo" accessibilityRole="header">
        {tr("review.summary.title")}
      </Text>
      <Card style={styles.card}>
        <Stat label={tr("review.summary.reviewed")} value={String(summary.reviewed)} />
        <Stat label={tr("review.summary.hits")} value={String(summary.hits)} />
        <Stat
          label={tr("review.summary.memory")}
          value={`${summary.memoryAfter} (${delta >= 0 ? "+" : ""}${delta})`}
        />
        {summary.retries > 0 ? (
          <Stat label={tr("review.summary.retries")} value={String(summary.retries)} />
        ) : null}
      </Card>
      <View style={styles.flex} />
      <Button label={tr("review.summary.back")} onPress={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 72, paddingHorizontal: space.xl, paddingBottom: 28, gap: space["2xl"] },
  card: { gap: space["2xl"] },
  stat: { gap: 4 },
  flex: { flex: 1 },
});
