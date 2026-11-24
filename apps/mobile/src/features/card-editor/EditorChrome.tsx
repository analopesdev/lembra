import { Bold, Image as ImageIcon, Italic, List, Mic, Sigma } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Icon, Text } from "@/shared/ui";
import { radius, space } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

export function ToolButton({
  label,
  active,
  disabled,
  onPress,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.tool, active && { backgroundColor: t.tint }, disabled && { opacity: 0.4 }]}
    >
      {children}
    </Pressable>
  );
}

export function FormatToolbar({
  bold,
  italic,
  list,
  onBold,
  onItalic,
  onList,
}: {
  bold?: boolean;
  italic?: boolean;
  list?: boolean;
  onBold: () => void;
  onItalic: () => void;
  onList: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={[styles.toolbar, { borderTopColor: t.border }]}>
      <ToolButton label={tr("card.tools.bold")} active={bold} onPress={onBold}>
        <Icon icon={Bold} size={18} />
      </ToolButton>
      <ToolButton label={tr("card.tools.italic")} active={italic} onPress={onItalic}>
        <Icon icon={Italic} size={18} />
      </ToolButton>
      <ToolButton label={tr("card.tools.list")} active={list} onPress={onList}>
        <Icon icon={List} size={18} />
      </ToolButton>
      <ToolButton label={`${tr("card.tools.math")}, ${tr("add.soon")}`} disabled>
        <Icon icon={Sigma} size={18} />
      </ToolButton>
      <View style={styles.flex} />
      <ToolButton label={`${tr("card.tools.image")}, ${tr("add.soon")}`} disabled>
        <Icon icon={ImageIcon} size={18} />
      </ToolButton>
      <ToolButton label={`${tr("card.tools.audio")}, ${tr("add.soon")}`} disabled>
        <Icon icon={Mic} size={18} />
      </ToolButton>
    </View>
  );
}

export function EditorField({
  label,
  error,
  focused,
  minHeight,
  children,
}: {
  label: string;
  error?: string;
  focused: boolean;
  minHeight: number;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <Text variant="label">{label}</Text>
      <View
        accessible
        accessibilityLabel={label}
        style={[
          styles.field,
          {
            backgroundColor: t.surface,
            borderColor: error ? t.danger : focused ? t.button : t.border,
            borderWidth: focused || error ? 2 : 1,
            minHeight: minHeight + 48,
          },
        ]}
      >
        {children}
      </View>
      {error ? (
        <Text variant="legenda" tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export const editorStyles = StyleSheet.create({
  wrap: { gap: space.sm },
  flex: { flex: 1 },
  field: { borderRadius: radius.md, overflow: "hidden" },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  tool: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});

const styles = editorStyles;
