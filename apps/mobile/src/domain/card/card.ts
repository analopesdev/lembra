import type { Importance } from "../types";

export type CardDraftError = "front_empty" | "back_empty" | "collection_missing";

export interface CardDraftInput {
  readonly front: string;
  readonly back: string;
  readonly collectionId: string | null;
  readonly importance: Importance;
}

export type CardDraftResult =
  | { ok: true; front: string; back: string; collectionId: string; importance: Importance }
  | { ok: false; errors: CardDraftError[] };

export function validateCardDraft(input: CardDraftInput): CardDraftResult {
  const front = input.front.trim();
  const back = input.back.trim();
  const errors: CardDraftError[] = [];
  if (front === "") errors.push("front_empty");
  if (back === "") errors.push("back_empty");
  if (input.collectionId === null) errors.push("collection_missing");
  if (errors.length > 0 || input.collectionId === null) return { ok: false, errors };
  return { ok: true, front, back, collectionId: input.collectionId, importance: input.importance };
}
