import { StyleSheet, View } from "react-native";

import { Button } from "./Button";
import { Sheet } from "./Sheet";
import { Text } from "./Text";
import { space } from "./theme";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  dismissLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  dismissLabel,
  destructive,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Sheet visible={visible} onClose={onCancel} closeLabel={dismissLabel}>
      <View style={styles.body}>
        <Text variant="titulo" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="corpo" tone="textMuted">
          {message}
        </Text>
      </View>
      <Button
        label={confirmLabel}
        variant={destructive ? "danger" : "primary"}
        onPress={onConfirm}
        loading={busy}
      />
      <Button label={cancelLabel} variant="ghost" onPress={onCancel} disabled={busy} />
    </Sheet>
  );
}

const styles = StyleSheet.create({ body: { gap: space.sm, paddingVertical: space.sm } });
