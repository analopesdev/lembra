// Barramento de mudanças por tabela: base das consultas reativas (ADR-0019).
// O repositório emite após cada commit; os `watch*` reexecutam a consulta.
export type TableName = "cards" | "card_states" | "review_logs" | "outbox";
type Listener = (tables: readonly TableName[]) => void;

export class ChangeBus {
  private listeners = new Set<Listener>();

  emit(tables: readonly TableName[]): void {
    for (const l of [...this.listeners]) l(tables);
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
