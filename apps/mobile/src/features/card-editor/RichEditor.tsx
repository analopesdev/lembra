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

function RichEditorInner({
  label,
  initialDoc,
  initialText,
  onChange,
  error,
  minHeight = 120,
  attachments,
  onImage,
  onAudio,
}: RichEditorProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const onChangeRef = useRef(onChange);
  const lastSent = useRef("");
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const css = `* { background-color: ${t.surface}; color: ${t.text}; font-family: system-ui, sans-serif; font-size: 16px; } html, body { margin: 0; padding: 0; } #root div.dynamic-height div.ProseMirror { box-sizing: border-box; padding: 12px; min-height: ${minHeight}px; } div.ProseMirror p { margin: 0 0 8px; }`;
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
    dynamicHeight: true,
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
      {attachments}
      <FormatToolbar
        bold={state.isBoldActive}
        italic={state.isItalicActive}
        list={state.isBulletListActive}
        onBold={() => editor.toggleBold()}
        onItalic={() => editor.toggleItalic()}
        onList={() => editor.toggleBulletList()}
        onImage={onImage}
        onAudio={onAudio}
      />
    </EditorField>
  );
}

export function RichEditor(props: RichEditorProps) {
  const mounted = useHydrated();
  return mounted ? (
    <RichEditorInner {...props} />
  ) : (
    <View style={{ minHeight: (props.minHeight ?? 120) + 44 }} />
  );
}
