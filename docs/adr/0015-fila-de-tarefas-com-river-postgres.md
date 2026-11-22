# ADR-0015: Fila de tarefas com River (Postgres)

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Backend

## Contexto

Gerar cards de um PDF, criar quizzes, processar mídia e otimizar parâmetros FSRS são tarefas lentas que não cabem numa requisição HTTP.

## Decisão

- River como fila de tarefas, usando o próprio Postgres (sem Redis).
- API cria o job e responde `202 Accepted` com `job_id`; app consulta `GET /v1/jobs/{id}` ou recebe o resultado no próximo pull.
- Jobs idempotentes, com tentativas e backoff; falha definitiva vira estado visível no app.
- Binário separado `cmd/worker`, escalável à parte.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Goroutines na API | Perde tarefas em deploy/queda. |
| Redis + Asynq | Mais uma peça de infraestrutura. |
| Fila gerenciada (SQS/Cloud Tasks) | Dependência de nuvem específica. |

## Consequências

**Positivas**

- Transação única entre dados e criação do job.
- Infra mínima.

**Negativas / riscos**

- Carga da fila no mesmo banco (irrelevante na escala de um usuário).

## Relacionados

ADR-0005, ADR-0018
