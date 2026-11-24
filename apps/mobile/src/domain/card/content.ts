import { z } from "zod";

export const CONTENT_SCHEMA_VERSION = 1;

const mark = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }),
  z.object({ type: z.literal("italic") }),
  z.object({ type: z.literal("code") }),
  z.object({ type: z.literal("highlight") }),
  z.object({ type: z.literal("color"), attrs: z.object({ color: z.string().min(1) }) }),
]);

const text = z.object({ type: z.literal("text"), text: z.string(), marks: z.array(mark).optional() });
const cloze = z.object({
  type: z.literal("cloze"),
  attrs: z.object({ id: z.number().int().min(1) }),
  content: z.array(text),
});
const math = z.object({ type: z.literal("math"), attrs: z.object({ latex: z.string() }) });
const inline = z.union([text, cloze, math]);

const paragraph = z.object({ type: z.literal("paragraph"), content: z.array(inline).optional() });
const codeBlock = z.object({
  type: z.literal("code"),
  attrs: z.object({ language: z.string().optional() }).optional(),
  content: z.array(text).optional(),
});
const image = z.object({
  type: z.literal("image"),
  attrs: z.object({ mediaId: z.string().min(1), alt: z.string().optional() }),
});
const audio = z.object({
  type: z.literal("audio"),
  attrs: z.object({ mediaId: z.string().min(1), autoplay: z.boolean().optional() }),
});
const video = z.object({
  type: z.literal("video"),
  attrs: z.object({ mediaId: z.string().min(1) }),
});

type Block =
  | z.infer<typeof paragraph>
  | z.infer<typeof codeBlock>
  | z.infer<typeof image>
  | z.infer<typeof audio>
  | z.infer<typeof video>
  | ListNode;
interface ListNode {
  type: "bulletList" | "orderedList";
  content: { type: "listItem"; content: z.infer<typeof paragraph>[] }[];
}

const listItem = z.object({ type: z.literal("listItem"), content: z.array(paragraph) });
const list = z.object({
  type: z.enum(["bulletList", "orderedList"]),
  content: z.array(listItem),
});

const block: z.ZodType<Block> = z.union([paragraph, codeBlock, image, audio, video, list]);

export const contentDoc = z.object({
  type: z.literal("doc"),
  v: z.literal(CONTENT_SCHEMA_VERSION),
  content: z.array(block),
});

export type ContentDoc = z.infer<typeof contentDoc>;

export function fromPlainText(value: string): ContentDoc {
  const lines = value.split("\n");
  return {
    type: "doc",
    v: CONTENT_SCHEMA_VERSION,
    content: lines.map((line) => ({
      type: "paragraph" as const,
      ...(line === "" ? {} : { content: [{ type: "text" as const, text: line }] }),
    })),
  };
}

export type ParseContent = { ok: true; doc: ContentDoc } | { ok: false };

export function parseContent(raw: string | null): ParseContent {
  if (raw === null) return { ok: false };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false };
  }
  const parsed = contentDoc.safeParse(json);
  return parsed.success ? { ok: true, doc: parsed.data } : { ok: false };
}

export function serializeContent(doc: ContentDoc): string {
  return JSON.stringify(doc);
}

function inlineText(node: z.infer<typeof inline>): string {
  if (node.type === "text") return node.text;
  if (node.type === "math") return node.attrs.latex;
  return node.content.map((t) => t.text).join("");
}

function blockText(b: Block): string {
  switch (b.type) {
    case "paragraph":
      return (b.content ?? []).map(inlineText).join("");
    case "code":
      return (b.content ?? []).map((t) => t.text).join("");
    case "bulletList":
    case "orderedList":
      return b.content.map((item) => item.content.map(blockText).join("\n")).join("\n");
    default:
      return "";
  }
}

export function toPlainText(doc: ContentDoc): string {
  return doc.content
    .map(blockText)
    .filter((s, i, all) => s !== "" || (i > 0 && i < all.length - 1))
    .join("\n")
    .trim();
}

export function isEmptyContent(doc: ContentDoc): boolean {
  const hasMedia = doc.content.some((b) => b.type === "image" || b.type === "audio" || b.type === "video");
  return !hasMedia && toPlainText(doc) === "";
}

export function mediaIds(doc: ContentDoc): string[] {
  const ids: string[] = [];
  for (const b of doc.content) {
    if (b.type === "image" || b.type === "audio" || b.type === "video") ids.push(b.attrs.mediaId);
  }
  return ids;
}

export function clozeIds(doc: ContentDoc): number[] {
  const ids = new Set<number>();
  const visit = (nodes: readonly Block[]) => {
    for (const b of nodes) {
      if (b.type === "paragraph") {
        for (const n of b.content ?? []) if (n.type === "cloze") ids.add(n.attrs.id);
      } else if (b.type === "bulletList" || b.type === "orderedList") {
        for (const item of b.content) visit(item.content);
      }
    }
  };
  visit(doc.content);
  return [...ids].sort((a, b) => a - b);
}

const CLOZE_SYNTAX = /\{\{([^{}]+)\}\}/g;

export function clozeDocFromSyntax(value: string): ContentDoc | null {
  let nextId = 1;
  let found = 0;
  const content = value.split("\n").map((line) => {
    const nodes: z.infer<typeof inline>[] = [];
    let last = 0;
    for (const m of line.matchAll(CLOZE_SYNTAX)) {
      const start = m.index ?? 0;
      if (start > last) nodes.push({ type: "text", text: line.slice(last, start) });
      nodes.push({
        type: "cloze",
        attrs: { id: nextId++ },
        content: [{ type: "text", text: (m[1] ?? "").trim() }],
      });
      found++;
      last = start + m[0].length;
    }
    if (last < line.length) nodes.push({ type: "text", text: line.slice(last) });
    return { type: "paragraph" as const, ...(nodes.length === 0 ? {} : { content: nodes }) };
  });
  return found === 0 ? null : { type: "doc", v: CONTENT_SCHEMA_VERSION, content };
}

export function clozeSyntaxFromDoc(doc: ContentDoc): string {
  return doc.content
    .map((b) =>
      b.type === "paragraph"
        ? (b.content ?? [])
            .map((n) => (n.type === "cloze" ? `{{${n.content.map((t) => t.text).join("")}}}` : inlineText(n)))
            .join("")
        : blockText(b),
    )
    .join("\n");
}
