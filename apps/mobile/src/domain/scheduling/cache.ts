// Campos denormalizados de `card_states` (ADR-0032): calculados SÓ aqui, num único ponto, e gravados na
// mesma transação da revisão ou da mudança de status. O cache é descartável: `rebuildCache` o recria.
import { retainedUntilMs } from "../memory/memory";
import type { CardStatus, Importance } from "../types";
import { applyReview, initialState, type CardState, type FsrsParams, type ReviewEvent } from "./derive-state";

export interface CacheCard {
  readonly status: CardStatus;
  readonly deletedAt: Date | null;
  readonly importance: Importance;
  readonly collectionId: string;
}

export interface CacheRow {
  /** Ativo e não excluído: entra na tela Hoje e no agendador. */
  readonly isActive: 0 | 1;
  readonly importance: Importance;
  readonly collectionId: string;
  /** Última revisão + S dias: R ≥ 90% até lá (RN-06). */
  readonly retainedUntil: number | null; // ms UTC
}

export function cacheRow(card: CacheCard, state: CardState): CacheRow {
  return {
    isActive: card.status === "active" && card.deletedAt === null ? 1 : 0,
    importance: card.importance,
    collectionId: card.collectionId,
    retainedUntil: retainedUntilMs(state),
  };
}

export interface CacheEntry {
  readonly cardId: string;
  readonly state: CardState;
  readonly row: CacheRow;
}

/**
 * Job "rebuild card_states": recalcula estado e campos denormalizados do zero a partir do histórico.
 * Obrigatório após reotimização dos parâmetros (S muda, logo retained_until muda) — ADR-0032.
 * O histórico de cada card deve vir em ordem canônica (`sortHistory`).
 */
export function rebuildCache(
  cards: readonly {
    readonly id: string;
    readonly card: CacheCard;
    readonly history: readonly ReviewEvent[];
    readonly createdAt: Date;
  }[],
  params: FsrsParams,
): CacheEntry[] {
  return cards.map(({ id, card, history, createdAt }) => {
    const state = history.reduce((s, ev) => applyReview(s, ev, params), initialState(createdAt));
    return { cardId: id, state, row: cacheRow(card, state) };
  });
}
