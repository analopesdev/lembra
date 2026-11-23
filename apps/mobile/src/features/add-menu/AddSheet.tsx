import {
  AlignLeft,
  ChevronRight,
  Folder,
  Image as ImageIcon,
  Pencil,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { useFlag } from "@/shared/lib/flags";
import { Icon, Sheet, Tag, Text } from "@/shared/ui";
import { radius, space } from "@/shared/ui/theme";
import { useTheme, type Colors } from "@/shared/ui/useTheme";

export type AddChoice = "pdf" | "text" | "card" | "collection";

type Props = { visible: boolean; onClose: () => void; onChoose: (choice: AddChoice) => void };

interface Row {
  key: AddChoice | "photo";
  icon: LucideIcon;
  bg: keyof Colors;
  fg: keyof Colors;
  needsAi: boolean;
  alwaysSoon?: boolean;
}

const AI_ROWS: Row[] = [
  { key: "pdf", icon: Upload, bg: "tint", fg: "onTint", needsAi: true },
  { key: "text", icon: AlignLeft, bg: "collection2", fg: "onCollection2", needsAi: true },
];

const MANUAL_ROWS: Row[] = [
  { key: "card", icon: Pencil, bg: "collection3", fg: "onCollection3", needsAi: false },
  { key: "collection", icon: Folder, bg: "collection3", fg: "onCollection3", needsAi: false },
  { key: "photo", icon: ImageIcon, bg: "surfaceMuted", fg: "textMuted", needsAi: false, alwaysSoon: true },
];

function OptionRow({ row, enabled, onPress }: { row: Row; enabled: boolean; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const title = tr(`add.${row.key}.title`);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={enabled ? title : `${title}, ${tr("add.soon")}`}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: t[row.bg] }]}>
        <Icon icon={row.icon} size={24} color={row.fg} />
      </View>
      <View style={styles.rowText}>
        <Text variant="subtitulo">{title}</Text>
        <Text variant="label" tone="textMuted" style={styles.sub}>
          {tr(`add.${row.key}.sub`)}
        </Text>
      </View>
      <View style={styles.trailing}>
        {enabled ? <Icon icon={ChevronRight} size={20} color="textMuted" /> : null}
      </View>
      {enabled ? null : (
        <View style={styles.soon}>
          <Tag label={tr("add.soon")} />
        </View>
      )}
    </Pressable>
  );
}

export function AddSheet({ visible, onClose, onChoose }: Props) {
  const { t: tr } = useTranslation();
  const t = useTheme();
  const aiEnabled = useFlag("ai_generation");
  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={tr("add.close")}>
      <View style={styles.head}>
        <Text variant="titulo" style={styles.title}>
          {tr("add.title")}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr("add.close")}
          onPress={onClose}
          style={[styles.close, { backgroundColor: t.surface }]}
        >
          <Icon icon={X} size={18} strokeWidth={2.2} />
        </Pressable>
      </View>
      <Text variant="legenda" tone="textMuted" style={styles.section}>
        {tr("add.withAi")}
      </Text>
      {AI_ROWS.map((r) => (
        <OptionRow key={r.key} row={r} enabled={aiEnabled} onPress={() => onChoose(r.key as AddChoice)} />
      ))}
      <Text variant="legenda" tone="textMuted" style={[styles.section, styles.sectionGap]}>
        {tr("add.manual")}
      </Text>
      {MANUAL_ROWS.map((r) => (
        <OptionRow key={r.key} row={r} enabled={!r.alwaysSoon} onPress={() => onChoose(r.key as AddChoice)} />
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: space.sm,
    paddingBottom: 4,
  },
  title: { fontSize: 22 },
  close: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  section: { fontWeight: "700", letterSpacing: 0.72, textTransform: "uppercase" },
  sectionGap: { paddingTop: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  rowIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1, gap: 2 },
  sub: { fontWeight: "400" },
  trailing: { width: 20, alignItems: "center" },
  soon: { position: "absolute", top: 4, right: 6 },
});
