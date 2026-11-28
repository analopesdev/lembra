import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";

import { fromEditorJson, fromPlainText, toEditorJson, toPlainText } from "@/domain/card/content";
import { fonts, space, type as scale } from "@/shared/ui/theme";
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
  const [tick, setTick] = useState(0);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const initialContent = useMemo(
    () => toEditorJson(initialDoc ?? fromPlainText(initialText)) as JSONContent,
    [initialDoc, initialText],
  );
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        orderedList: false,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        "aria-label": label,
        style: `outline:none;min-height:${minHeight}px;padding:${space.lg}px;font-size:${scale.corpo.size}px;line-height:${scale.corpo.lineHeight};font-family:${fonts.text.regular},system-ui,sans-serif;color:${t.text}`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      const doc = fromEditorJson(ed.getJSON());
      if (doc) onChangeRef.current({ text: toPlainText(doc), doc });
    },
    onSelectionUpdate: () => setTick((n) => n + 1),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  });

  void tick;

  return (
    <EditorField label={label} error={error} focused={focused} minHeight={minHeight}>
      <View style={{ minHeight, backgroundColor: t.surface }}>
        {editor ? <EditorContent editor={editor} /> : null}
      </View>
      {attachments}
      <FormatToolbar
        bold={!!editor?.isActive("bold")}
        italic={!!editor?.isActive("italic")}
        list={!!editor?.isActive("bulletList")}
        onBold={() => editor?.chain().focus().toggleBold().run()}
        onItalic={() => editor?.chain().focus().toggleItalic().run()}
        onList={() => editor?.chain().focus().toggleBulletList().run()}
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
