# ADR-0009: IDs UUIDv7 gerados no cliente

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Dados

## Contexto

Registros são criados offline e precisam de identidade antes de chegar ao servidor.

## Decisão

- Todas as entidades usam UUIDv7, gerado onde o registro nasce (normalmente no app).
- O servidor aceita o ID do cliente e rejeita duplicatas com dono diferente.
- Colunas `uuid` no Postgres e `TEXT` no SQLite.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| IDs sequenciais do servidor | Impossível criar offline. |
| UUIDv4 | Não ordena por tempo; índices piores. |

## Consequências

**Positivas**

- Criação offline sem remapear IDs.
- Ordenação natural por tempo.

**Negativas / riscos**

- IDs maiores que inteiros.

## Relacionados

ADR-0008
