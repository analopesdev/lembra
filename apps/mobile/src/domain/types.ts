// Tipos puros do domínio (sem React, I/O nem relógio). Conteúdo rico (ADR-0017) entra na Etapa 4;
// por ora frente e verso são texto simples.
import type { CardState } from "./scheduling";

export type Id = string; // UUIDv7 (ADR-0009)

export type CardStatus = "draft" | "active" | "suspended" | "problematic";
export type Importance = 1 | 2 | 3;

export interface Card {
  readonly id: Id;
  readonly collectionId: Id;
  readonly front: string;
  readonly back: string;
  readonly tags: readonly string[];
  readonly importance: Importance;
  readonly status: CardStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

export interface CardWithState {
  readonly card: Card;
  readonly state: CardState;
}
