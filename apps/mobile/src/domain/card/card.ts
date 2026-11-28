import { clozeDocFromSyntax, serializeContent } from "./content";
import { clozeView } from "./kind";
import type { CardKind, Importance } from "../types";

export type CardDraftError = "front_empty" | "back_empty" | "collection_missing" | "cloze_missing";

export interface CardDraftInput {
  readonly front: string;
  readonly back: string;
  readonly collectionId: string | null;
  readonly importance: Importance;
  readonly kind?: CardKind;
  readonly frontHasMedia?: boolean;
  readonly backHasMedia?: boolean;
}

export type CardDraftResult =
  | {
      ok: true;
      front: string;
      back: string;
      frontDoc: string | null;
      collectionId: string;
      importance: Importance;
      kind: CardKind;
    }
  | { ok: false; errors: CardDraftError[] };

export function validateCardDraft(input: CardDraftInput): CardDraftResult {
  const kind = input.kind ?? "basic";
  const front = input.front.trim();
  const back = input.back.trim();
  const errors: CardDraftError[] = [];
  const doc = kind === "cloze" ? clozeDocFromSyntax(front) : null;
  const view = doc ? clozeView(serializeContent(doc)) : null;
  if (front === "" && !(kind !== "cloze" && input.frontHasMedia)) errors.push("front_empty");
  else if (kind === "cloze" && !view) errors.push("cloze_missing");
  if (kind !== "cloze" && back === "" && !input.backHasMedia) errors.push("back_empty");
  if (input.collectionId === null) errors.push("collection_missing");
  if (errors.length > 0 || input.collectionId === null) return { ok: false, errors };
  if (kind === "cloze" && doc && view) {
    return {
      ok: true,
      front: view.front,
      back: view.back,
      frontDoc: serializeContent(doc),
      collectionId: input.collectionId,
      importance: input.importance,
      kind,
    };
  }
  return {
    ok: true,
    front,
    back,
    frontDoc: null,
    collectionId: input.collectionId,
    importance: input.importance,
    kind,
  };
}
