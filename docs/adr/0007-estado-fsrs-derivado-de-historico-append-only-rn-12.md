# ADR-0007: Estado FSRS derivado de histórico append-only (RN-12)

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Domínio

## Contexto

Se o estado de cada card (estabilidade, dificuldade, vencimento) fosse sincronizado como valor, duas revisões em aparelhos diferentes gerariam conflito sem solução correta.

## Decisão

- `review_logs` é **append-only**: nunca há UPDATE ou DELETE.
- O estado do card é **função pura** do histórico ordenado + parâmetros FSRS.
- `card_states` é apenas cache; pode ser apagado e recalculado a qualquer momento.
- Ao receber revisões novas no sync, recalcula-se o estado só dos cards afetados.
- Correção manual de nota gera um novo evento (`grade_corrected`), não altera o anterior.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Sincronizar o estado com 'última escrita vence' | Perde revisões feitas em outro aparelho. |
| CRDT completo | Complexo demais para o problema. |

## Consequências

**Positivas**

- Sync de revisões sem conflito (união de conjuntos).
- Auditoria completa e possibilidade de reprocessar com novos parâmetros.

**Negativas / riscos**

- Recalcular um card com histórico longo custa mais (mitigado por cache e recálculo incremental).

## Relacionados

ADR-0006, ADR-0008
