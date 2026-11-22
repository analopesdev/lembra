# ADR-0001: Monorepo com app, backend e contratos

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Organização

## Contexto

O projeto tem três peças que mudam juntas: o app (Expo), o backend (Go) e os contratos entre eles (API e regras do FSRS). Em repositórios separados, uma mudança de contrato exige PRs coordenados e é fácil um lado ficar para trás.

## Decisão

- Um único repositório Git com `apps/mobile/` (Expo), `backend/` (Go), `contracts/` (OpenAPI e vetores de teste do FSRS) e `docs/` (requisitos e ADRs).
- Ferramenta de workspace: pnpm workspaces para o lado TypeScript; Go modules no `backend/`. Sem Nx/Turborepo na v1.
- CI com filtros por caminho: muda `backend/` → roda só o pipeline Go; muda `contracts/` → roda os dois.
- Um `Makefile` na raiz com atalhos (`make dev`, `make test`, `make gen`).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Repositórios separados | Exige versionar e publicar contratos; mais atrito para uma pessoa só. |
| Nx/Turborepo | Útil com muitos pacotes; complexidade desnecessária para 2 apps. |

## Consequências

**Positivas**

- Mudança de contrato e implementações no mesmo PR.
- Um lugar só para documentação e decisões.

**Negativas / riscos**

- CI precisa de filtros por caminho para não ficar lento.

## Relacionados

ADR-0011, ADR-0006
