# ADR-0004: Go com monólito modular e arquitetura hexagonal

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Backend

## Contexto

O backend deve ser fácil de testar, evoluir e manter. Há vários domínios (cards, revisão, quiz, hábito, IA, sync) que crescem em ritmos diferentes.

## Decisão

- Go, um binário de API (`cmd/api`) e um de worker (`cmd/worker`).
- Monólito modular: `internal/modules/<modulo>/` com `domain/` (regras puras), `app/` (casos de uso + interfaces) e `adapters/` (http, postgres…).
- Regra de dependência: `adapters → app → domain`; módulos só se falam pela API pública (`app.Service`). Verificado no lint.
- Injeção de dependência manual no `main.go`; sem framework.
- `net/http` (ou chi) como roteador; sem framework web pesado.
- Tempo (`Clock`) e geração de IDs injetados como dependências.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Microsserviços | Custo operacional alto sem benefício para um usuário. |
| Estrutura em camadas global (handlers/, services/, repos/) | Mistura domínios e dificulta extrair ou entender um módulo. |
| Frameworks (Gin/Fiber + DI) | Mais mágica; o stdlib atende. |

## Consequências

**Positivas**

- Regra de negócio testável sem banco e sem rede.
- Trocar tecnologia = novo adaptador.

**Negativas / riscos**

- Mais arquivos e interfaces que um CRUD simples.
- Exige disciplina, por isso o lint de arquitetura.

## Relacionados

BACKEND.md, ADR-0005, ADR-0021
