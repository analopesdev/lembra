import { ChevronLeft, ImagePlus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { MAX_MESSAGE_LENGTH, type FeedbackType } from "@/domain/feedback/feedback";
import { Button, Icon, Input, Num, Tag, Text, Toggle } from "@/shared/ui";
import { fonts, space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

type Props = {
  type: FeedbackType;
  onType: (v: FeedbackType) => void;
  message: string;
  onMessage: (v: string) => void;
  includeDevice: boolean;
  onIncludeDevice: (v: boolean) => void;
  replyTo: string | null;
  error?: string;
  sent: boolean;
  busy?: boolean;
  onSubmit: () => void;
  onBack: () => void;
};

const TYPES: FeedbackType[] = ["suggestion", "problem", "complaint"];

export function FeedbackView(p: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("feedback.back")}
          onPress={p.onBack}
          style={[styles.back, { borderColor: t.border, backgroundColor: t.surface }]}
        >
          <Icon icon={ChevronLeft} size={20} strokeWidth={2.2} />
        </Pressable>
        <Text variant="titulo" accessibilityRole="header" style={styles.title}>
          {tr("feedback.title")}
        </Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.intro}>
        <Text style={styles.headline}>{tr("feedback.headline")}</Text>
        <Text variant="corpo" tone="textMuted">
          {tr("feedback.lead")}
        </Text>
      </View>

      <View style={styles.group}>
        <Text variant="label">{tr("feedback.type")}</Text>
        <View accessibilityRole="radiogroup" style={styles.row}>
          {TYPES.map((type) => {
            const on = type === p.type;
            return (
              <Pressable
                key={type}
                accessibilityRole="radio"
                accessibilityLabel={tr(`feedback.types.${type}`)}
                accessibilityState={{ selected: on }}
                onPress={() => p.onType(type)}
                style={[
                  styles.chip,
                  { backgroundColor: on ? t.primary : t.surface, borderColor: on ? t.primary : t.border },
                ]}
              >
                <Text variant="label" tone={on ? "onPrimary" : "text"} style={styles.chipText}>
                  {tr(`feedback.types.${type}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <Input
          label={tr("feedback.message")}
          value={p.message}
          onChangeText={p.onMessage}
          minLines={6}
          error={p.error}
          maxLength={MAX_MESSAGE_LENGTH + 200}
        />
        <View style={styles.counter}>
          <Num size={12} tone="textMuted" style={styles.counterNum}>
            {p.message.length}
          </Num>
          <Text variant="legenda" tone="textMuted">
            {" / "}
          </Text>
          <Num size={12} tone="textMuted" style={styles.counterNum}>
            {MAX_MESSAGE_LENGTH}
          </Num>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${tr("feedback.attach")}, ${tr("add.soon")}`}
        accessibilityState={{ disabled: true }}
        disabled
        style={[styles.attach, { borderColor: t.border }]}
      >
        <Icon icon={ImagePlus} size={18} color="textMuted" />
        <Text variant="label" tone="textMuted" style={styles.attachText}>
          {tr("feedback.attach")}
        </Text>
        <Tag label={tr("add.soon")} />
      </Pressable>

      <View style={styles.deviceRow}>
        <View style={styles.flex}>
          <Text variant="label" style={styles.deviceTitle}>
            {tr("feedback.device")}
          </Text>
          <Text variant="legenda" tone="textMuted">
            {tr("feedback.deviceHint")}
          </Text>
        </View>
        <Toggle value={p.includeDevice} onValueChange={p.onIncludeDevice} label={tr("feedback.device")} />
      </View>

      <View style={styles.flex} />
      {p.sent ? (
        <Text variant="label" tone="success" accessibilityRole="alert" style={styles.center}>
          {tr("feedback.sent")}
        </Text>
      ) : null}
      <Button label={tr("feedback.send")} onPress={p.onSubmit} loading={p.busy} />
      {p.replyTo ? (
        <Text variant="legenda" tone="textMuted" style={styles.center}>
          {tr("feedback.replyTo", { email: p.replyTo })}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 56, paddingHorizontal: space.xl, paddingBottom: 32, gap: space.xl },
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
  intro: { gap: space.sm },
  headline: { fontFamily: fonts.text.extrabold, fontSize: 30, lineHeight: 35, letterSpacing: -0.75 },
  group: { gap: space.sm },
  row: { flexDirection: "row", gap: 6 },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chipText: { fontWeight: "700" },
  counter: { alignSelf: "flex-end", flexDirection: "row", alignItems: "baseline" },
  counterNum: { fontWeight: "500", lineHeight: 14 },
  attach: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    opacity: 0.8,
  },
  attachText: { flex: 1, fontWeight: "600" },
  deviceRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  deviceTitle: { fontSize: 14, fontWeight: "600" },
  center: { textAlign: "center" },
});
