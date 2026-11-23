import { Modal, Pressable, StyleSheet, View } from "react-native";

import { radius, space } from "./theme";
import { useTheme } from "./useTheme";

type Props = { visible: boolean; onClose: () => void; closeLabel: string; children: React.ReactNode };

/** Folha inferior: fundo escurecido por `scrim`, painel com cantos 28 e alça. */
export function Sheet({ visible, onClose, closeLabel, children }: Props) {
  const t = useTheme();
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        onPress={onClose}
        style={[styles.scrim, { backgroundColor: t.scrim }]}
      />
      <View style={[styles.panel, { backgroundColor: t.background }]}>
        <View style={[styles.handle, { backgroundColor: t.border }]} />
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: 36,
    gap: space.md,
  },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: radius.pill },
});
