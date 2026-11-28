import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, View, type TextStyle } from "react-native";

import { getContainer } from "@/data/container";
import { parseContent, type ContentDoc } from "@/domain/card/content";
import { CLOZE_PLACEHOLDER } from "@/domain/card/kind";
import { Text, type Variant } from "@/shared/ui";
import { useTheme } from "@/shared/ui/useTheme";

type Props = {
  doc: string | null;
  fallback: string;
  variant?: Variant;
  style?: TextStyle;
  cloze?: ClozeMode;
};

export type ClozeMode = "hide" | "reveal";

type Inline = NonNullable<Extract<ContentDoc["content"][number], { type: "paragraph" }>["content"]>[number];

function Runs({
  nodes,
  variant,
  style,
  cloze,
}: {
  nodes: readonly Inline[];
  variant: Variant;
  style?: TextStyle;
  cloze: ClozeMode;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Text variant={variant} style={style}>
      {nodes.map((n, i) => {
        if (n.type === "text") {
          const marks = n.marks ?? [];
          const s: { -readonly [K in keyof TextStyle]: TextStyle[K] } = {};
          if (marks.some((m) => m.type === "bold")) s.fontWeight = "800";
          if (marks.some((m) => m.type === "italic")) s.fontStyle = "italic";
          if (marks.some((m) => m.type === "highlight")) s.backgroundColor = t.tint;
          const color = marks.find((m) => m.type === "color");
          if (color && color.type === "color") s.color = color.attrs.color;
          return (
            <Text key={i} variant={variant} style={[style, s]}>
              {n.text}
            </Text>
          );
        }
        if (n.type === "math") {
          return (
            <Text key={i} variant={variant} style={[style, styles.mono]}>
              {n.attrs.latex}
            </Text>
          );
        }
        const hidden = cloze === "hide";
        return (
          <Text
            key={i}
            variant={variant}
            accessibilityLabel={hidden ? tr("review.blank") : undefined}
            style={[style, styles.cloze, { backgroundColor: t.tint, color: t.onTint }]}
          >
            {hidden ? ` ${CLOZE_PLACEHOLDER} ` : n.content.map((c) => c.text).join("")}
          </Text>
        );
      })}
    </Text>
  );
}

export function ContentText({ doc, fallback, variant = "corpo", style, cloze = "reveal" }: Props) {
  const parsed = parseContent(doc);
  if (!parsed.ok) {
    return (
      <Text variant={variant} style={style}>
        {fallback}
      </Text>
    );
  }
  return (
    <View style={styles.stack}>
      {parsed.doc.content.map((b, i) => {
        if (b.type === "paragraph") {
          return b.content && b.content.length > 0 ? (
            <Runs key={i} nodes={b.content} variant={variant} style={style} cloze={cloze} />
          ) : (
            <Text key={i} variant={variant} style={style}>
              {" "}
            </Text>
          );
        }
        if (b.type === "bulletList" || b.type === "orderedList") {
          return (
            <View key={i} style={styles.list}>
              {b.content.map((item, j) => (
                <View key={j} style={styles.item}>
                  <Text variant={variant} style={style}>
                    {b.type === "bulletList" ? "•" : `${j + 1}.`}
                  </Text>
                  <View style={styles.itemBody}>
                    {item.content.map((p, k) => (
                      <Runs key={k} nodes={p.content ?? []} variant={variant} style={style} cloze={cloze} />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          );
        }
        if (b.type === "code") {
          return (
            <Text key={i} variant={variant} style={[style, styles.mono]}>
              {(b.content ?? []).map((c) => c.text).join("")}
            </Text>
          );
        }
        if (b.type === "image" || b.type === "audio" || b.type === "video") {
          return <AttachedMedia key={i} id={b.attrs.mediaId} kind={b.type} />;
        }
        return null;
      })}
    </View>
  );
}

function AttachedMedia({ id, kind }: { id: string; kind: "image" | "audio" | "video" }) {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void getContainer().then((c) =>
      c.media.get(id).then((m) => {
        if (live) setUri(m?.localPath ?? null);
      }),
    );
    return () => {
      live = false;
    };
  }, [id]);
  if (!uri) return null;
  if (kind === "image") {
    return <Image source={{ uri }} style={styles.img} accessibilityLabel="" />;
  }
  return (
    <Text variant="legenda" style={styles.audio}>
      {uri}
    </Text>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8 },
  list: { gap: 4 },
  item: { flexDirection: "row", gap: 8 },
  itemBody: { flex: 1 },
  mono: { fontFamily: "monospace" },
  cloze: { fontWeight: "800" },
  img: { width: "100%", height: 180 },
  audio: { marginTop: 4 },
});
