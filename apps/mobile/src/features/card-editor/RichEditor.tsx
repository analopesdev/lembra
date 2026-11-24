import {
  CoreBridge,
  RichText,
  TenTapStartKit,
  useBridgeState,
  useEditorBridge,
  useEditorContent,
} from "@10play/tentap-editor";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";

import {
  fromEditorJson,
  fromPlainText,
  serializeContent,
  toEditorJson,
  toPlainText,
} from "@/domain/card/content";
import { useHydrated, useTheme } from "@/shared/ui/useTheme";

import { EditorField, FormatToolbar } from "./EditorChrome";
import type { RichEditorProps, RichValue } from "./richTypes";

export type { RichValue };

function RichEditorInner({ label, initialDoc, initialText, onChange, error, minHeight = 120 }: RichEditorProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const onChangeRef = useRef(onChange);
  const lastSent = useRef("");
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const css = `* { background-color: ${t.surface}; color: ${t.text}; font-family: system-ui, sans-serif; font-size: 16px; } body { padding: 12px; }`;
  const initialContent = useMemo(
    () => toEditorJson(initialDoc ?? fromPlainText(initialText)),
    [initialDoc, initialText],
  );
  const extensions = useMemo(
    () => [...TenTapStartKit, CoreBridge.configureCSS(css)] as unknown as typeof TenTapStartKit,
    [css],
  );
  const theme = useMemo(() => ({ webview: { backgroundColor: t.surface } }), [t.surface]);
  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent,
    bridgeExtensions: extensions,
    theme: theme as never,
  });
  const content = useEditorContent(editor, { type: "json", debounceInterval: 250 });
  const state = useBridgeState(editor);

  useEffect(() => {
    if (!content) return;
    const doc = fromEditorJson(content);
    if (!doc) return;
    const sent = serializeContent(doc);
    if (sent === lastSent.current) return;
    lastSent.current = sent;
    onChangeRef.current({ text: toPlainText(doc), doc });
  }, [content]);

  return (
    <EditorField label={label} error={error} focused={focused} minHeight={minHeight}>
      <View style={{ minHeight }} onTouchStart={() => setFocused(true)}>
        <RichText editor={editor} style={{ minHeight }} onBlur={() => setFocused(false)} />
      </View>
      <FormatToolbar
        bold={state.isBoldActive}
        italic={state.isItalicActive}
        list={state.isBulletListActive}
        onBold={() => editor.toggleBold()}
        onItalic={() => editor.toggleItalic()}
        onList={() => editor.toggleBulletList()}
      />
    </EditorField>
  );
}

export function RichEditor(props: RichEditorProps) {
  const mounted = useHydrated();
  return mounted ? <RichEditorInner {...props} /> : <View style={{ minHeight: (props.minHeight ?? 120) + 44 }} />;
}
