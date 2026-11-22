# ADR-0021: Estratégia de testes

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Qualidade

## Contexto

O objetivo é facilitar testes e evolução segura. Regras críticas (agendamento, sync, nota) não podem regredir.

## Decisão

- Pirâmide: maioria unitária no domínio; casos de uso com fakes; integração com banco real; poucos E2E.
- Go: testes de tabela, `rapid` (propriedades), fakes escritos à mão, `testcontainers-go` (Postgres, MinIO), `kin-openapi` para contrato.
- App: Jest (`jest-expo`), `fast-check`, React Native Testing Library, MSW, Maestro (mobile) e Playwright (web).
- Comuns: vetores FSRS em `contracts/`; testes de propriedade do merge de sync nos dois lados.
- Tempo sempre injetado (`Clock`/`now`); proibido `sleep` em teste.
- Cobertura mínima: domínio 90%; casos de uso 80%; sync 85%; features 70%.
- Cada critério de aceite da v1 vira um teste E2E.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Mocks gerados | Testes frágeis e acoplados à implementação. |
| Só E2E | Lentos e pouco precisos. |

## Consequências

**Positivas**

- Feedback em segundos; refatoração segura.

**Negativas / riscos**

- Manter fakes alinhados às interfaces (testes de contrato ajudam).

## Relacionados

BACKEND.md §6, FRONTEND.md §7
