import type { Card, Id } from "../types";

import { clozeIds, parseContent, toPlainText, type ContentDoc } from "./content";

export function isReversedPair(a: Card, b: Card): boolean {
  return a.pairId === b.id || b.pairId === a.id;
}

export function reversedCompanion(main: Card, id: Id): Card {
  return {
    ...main,
    id,
    front: main.back,
    back: main.front,
    frontDoc: main.backDoc,
    backDoc: main.frontDoc,
    kind: "reversed",
    direction: "reverse",
    pairId: main.id,
  };
}

export function syncCompanion(main: Card, companion: Card): Card {
  return {
    ...companion,
    collectionId: main.collectionId,
    front: main.back,
    back: main.front,
    frontDoc: main.backDoc,
    backDoc: main.frontDoc,
    tags: main.tags,
    importance: main.importance,
    status: main.status,
    updatedAt: main.updatedAt,
    deletedAt: main.deletedAt,
  };
}

export const CLOZE_PLACEHOLDER = "[...]";

function clozeText(doc: ContentDoc, hide: boolean): string {
  const rendered: ContentDoc = {
    ...doc,
    content: doc.content.map((b) =>
      b.type === "paragraph"
        ? {
            ...b,
            content: (b.content ?? []).map((n) =>
              n.type === "cloze"
                ? {
                    type: "text" as const,
                    text: hide ? CLOZE_PLACEHOLDER : n.content.map((t) => t.text).join(""),
                  }
                : n,
            ),
          }
        : b,
    ),
  };
  return toPlainText(rendered);
}

export interface ClozeView {
  readonly count: number;
  readonly front: string;
  readonly back: string;
}

export function clozeView(rawDoc: string | null): ClozeView | null {
  const parsed = parseContent(rawDoc);
  if (!parsed.ok) return null;
  const count = clozeIds(parsed.doc).length;
  if (count === 0) return null;
  return { count, front: clozeText(parsed.doc, true), back: clozeText(parsed.doc, false) };
}
