import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, type ScrollViewProps } from "react-native";

export function KeyboardScroll({ children, ...rest }: ScrollViewProps) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "web" ? undefined : "padding"} style={styles.flex}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        {...rest}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
