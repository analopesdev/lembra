import type { CardState, Rating, ReviewEvent, ReviewKind } from "@/domain/scheduling";
import type { Card, CardWithState, Id } from "@/domain/types";

export type Unsubscribe = () => void;

/** Fonte reativa: emite o valor atual ao assinar e de novo a cada mudança relevante no banco. */
export interface Subscribable<T> {
  subscribe(onValue: (value: T) => void, onError?: (error: unknown) => void): Unsubscribe;
}

/** Colunas mínimas para a tela Hoje e a montagem da sessão (RN-01, RN-02, RN-06): sem texto do card. */
export interface ScheduleRow {
  readonly id: Id;
  readonly collectionId: Id | null;
  readonly importance: 1 | 2 | 3;
  readonly due: Date;
  readonly stability: number;
  readonly lastReview: Date | null;
}

/** Entrada da tela Hoje: contagens indexadas + só os cards vencidos (não todos os ativos). */
export interface CollectionStats {
  readonly collectionId: Id;
  readonly active: number;
  readonly retained: number;
}

export interface TodaySummary {
  readonly byCollection: readonly CollectionStats[];
  readonly activeCount: number;
  /** Cards ativos com R ≥ 90% agora (RN-06). */
  readonly retainedCount: number;
  /** Todos os vencidos (≤ now), em colunas enxutas, base de RN-01/RN-02. */
  readonly dueRows: readonly ScheduleRow[];
}

export interface ReviewInput {
  readonly id: Id;
  readonly cardId: Id;
  readonly at: Date;
  readonly rating: Rating;
  readonly retention?: number;
  readonly kind?: ReviewKind;
}

export interface CardListQuery {
  readonly collectionId: Id;
  readonly limit: number;
}

export interface CardListPage {
  readonly items: readonly Card[];
  readonly hasMore: boolean;
}

export interface ReviewRecord {
  readonly id: Id;
  readonly cardId: Id;
  readonly at: Date;
  readonly rating: Rating;
  readonly retention: number | null;
  readonly kind: ReviewKind;
}

export interface OutboxEntry {
  readonly id: string;
  readonly entity: "card" | "review" | "collection" | "settings";
  readonly entityId: Id;
  readonly op: "upsert" | "delete";
  readonly createdAt: Date;
}

/**
 * Toda leitura e escrita da UI passa por aqui (FRONTEND.md §5.1). Escritas gravam a mudança e a
 * entrada do outbox na MESMA transação (ADR-0008).
 */
export interface CardsRepository {
  /** Cards excluídos (`deletedAt`) não são devolvidos. */
  get(id: Id): Promise<Card | null>;
  /** Insere ou atualiza; card ativo sem estado ganha estado inicial (novo, vencendo agora). */
  save(card: Card): Promise<void>;
  /** Importação em lote (RF-45): tudo ou nada. */
  saveMany(cards: readonly Card[]): Promise<void>;
  softDelete(id: Id): Promise<void>;
  /** Rascunhos viram ativos e entram no agendador (RF-23). */
  approveDrafts(ids: readonly Id[]): Promise<void>;
  /** Ativos com vencimento ≤ `now`, por vencimento e ID. Exclui rascunhos, suspensos e excluídos. */
  watchDue(now: Date): Subscribable<readonly CardWithState[]>;
  /** Todos os ativos com estado: base da tela Hoje (memória retida, dívida, sessão). */
  watchActive(): Subscribable<readonly CardWithState[]>;
  /** Tela Hoje sem varrer a base inteira: custo proporcional aos vencidos, não ao total de cards. */
  watchToday(now: Date): Subscribable<TodaySummary>;
  watchCards(query: CardListQuery): Subscribable<CardListPage>;
  softDeleteByCollection(collectionId: Id): Promise<number>;
  listAll(): Promise<readonly Card[]>;
  listAllReviews(): Promise<readonly ReviewRecord[]>;
  importReviews(records: readonly ReviewRecord[]): Promise<number>;
  recordReview(input: ReviewInput): Promise<void>;
  getState(cardId: Id): Promise<CardState | null>;
  listReviews(cardId: Id): Promise<readonly ReviewEvent[]>;
  rebuildStates(): Promise<number>;
  pendingOutbox(): Promise<readonly OutboxEntry[]>;
}
