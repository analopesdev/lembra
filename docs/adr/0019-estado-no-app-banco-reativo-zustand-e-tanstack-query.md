# ADR-0019: Estado no app: banco reativo, Zustand e TanStack Query

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Frontend

## Contexto

Num app local-first, misturar cache de servidor com dados locais causa telas desatualizadas e bugs de sincronização.

## Decisão

- Dados persistidos: lidos do banco local por **consultas reativas**; a tela atualiza quando o banco muda (inclusive após sync).
- Estado efêmero de UI (sessão em andamento, formulário, modais): Zustand.
- TanStack Query **só** para chamadas online (gerar cards, status de job, nota da IA).
- Regras de negócio em `src/domain` (TS puro), chamadas pelos hooks das features.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Redux | Verboso para o tamanho do app. |
| TanStack Query para tudo | Duplica a fonte da verdade com o banco local. |

## Consequências

**Positivas**

- Uma fonte da verdade (o banco local).
- Domínio testável sem React.

**Negativas / riscos**

- Implementar consultas reativas sobre o SQLite na web (coberto pelo spike da ADR-0010).

## Relacionados

ADR-0010, FRONTEND.md
