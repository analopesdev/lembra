# ADR-0005: PostgreSQL com pgx, sqlc e goose

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Backend

## Contexto

O servidor guarda usuários, histórico de revisões, cards, quizzes, metadados de mídia e a fila de tarefas.

## Decisão

- PostgreSQL gerenciado (Neon ou Supabase) em produção; Docker Compose localmente.
- Driver `pgx`; SQL escrito à mão e código tipado gerado com `sqlc`.
- Migrações com `goose`, só para frente, compatíveis com a versão anterior do app.
- Toda tabela de usuário tem `user_id`, `created_at`, `updated_at`, `deleted_at`.
- A mesma instância hospeda a fila River (ADR-0015).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| ORM (GORM/ent) | Esconde o SQL e dificulta consultas de sync e índices finos. |
| SQLite no servidor | Bom para um usuário, mas limita hospedagem e a fila River. |

## Consequências

**Positivas**

- SQL explícito e tipado; consultas fáceis de otimizar.
- Uma única peça de infraestrutura para dados e fila.

**Negativas / riscos**

- Escrever SQL à mão para cada consulta.

## Relacionados

ADR-0004, ADR-0015
