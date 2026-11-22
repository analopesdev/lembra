# ADR-0008: Sincronização: outbox, push/pull e regras de conflito

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Dados

## Contexto

O mesmo usuário usa web, Android e iOS, às vezes offline. É preciso convergir os dados sem perder nada e sem um serviço de sync pago na v1.

## Decisão

- Cliente grava a mudança no SQLite e na tabela `outbox` na mesma transação.
- `POST /v1/sync/push`: envia lotes do outbox com `idempotency_key`; servidor responde com o que aceitou.
- `GET /v1/sync/pull?cursor=`: devolve mudanças desde o cursor (sequência monotônica do servidor).
- Regras: revisões e tentativas de quiz → união; cards, coleções, questões e configurações → última edição vence (`updated_at`, desempate por `device_id`); exclusões → `deleted_at`.
- Gatilhos: ao abrir o app, ao voltar do segundo plano, após uma sessão e a cada 5 min com rede.
- Testes de propriedade: merge comutativo, associativo e idempotente.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| PowerSync / ElectricSQL | Robustos, mas mais um serviço para operar; reavaliar se houver multiusuário. |
| Firebase/Firestore | Prende a um fornecedor e conflita com Go + Postgres. |

## Consequências

**Positivas**

- Simples, testável e sob controle total.
- Funciona com qualquer banco local.

**Negativas / riscos**

- Última edição vence pode descartar uma edição simultânea de card (raro com um usuário).

## Relacionados

ADR-0002, ADR-0007, ADR-0009
