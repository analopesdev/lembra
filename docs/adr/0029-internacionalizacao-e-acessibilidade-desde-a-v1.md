# ADR-0029: Internacionalização e acessibilidade desde a v1

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Frontend

## Contexto

Interface em português (RNF-10), cards em qualquer idioma e requisitos de acessibilidade (RNF-09).

## Decisão

- `i18next` com pt-BR padrão; nenhum texto fixo em componente.
- Números e datas com `Intl` (pt-BR).
- Rótulo de acessibilidade em todo elemento tocável; navegação por teclado na web; fonte ajustável; contraste AA.
- Lint `eslint-plugin-react-native-a11y` no CI.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Adiar i18n | Retrabalho grande depois. |

## Consequências

**Positivas**

- Pronto para outros idiomas e usuários com deficiência.

**Negativas / riscos**

- Disciplina extra ao criar telas.

## Relacionados

RNF-09, RNF-10
