# ADR-0011: Contrato de API primeiro (OpenAPI) com geração de código

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Integração

## Contexto

App e backend em linguagens diferentes precisam concordar em formatos, erros e versões.

## Decisão

- `contracts/openapi.yaml` é a fonte da verdade da API HTTP.
- Go: `oapi-codegen` gera tipos e interface do servidor. App: `openapi-typescript` + `openapi-fetch`.
- CI falha se o código gerado estiver desatualizado.
- Testes do backend validam cada resposta contra o schema (`kin-openapi`).
- Erros em RFC 9457 (problem+json); versão no caminho (`/v1`); paginação por cursor.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| gRPC/Connect | Ótimo, mas pior na web e mais ferramentas. |
| GraphQL | Flexível demais para uma API de sync simples. |

## Consequências

**Positivas**

- Tipos iguais dos dois lados.
- Documentação sempre atualizada.

**Negativas / riscos**

- Editar YAML antes de codar exige disciplina.

## Relacionados

ADR-0001
