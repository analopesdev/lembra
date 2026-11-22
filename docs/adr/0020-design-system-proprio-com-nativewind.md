# ADR-0020: Design system próprio com NativeWind

- **Status:** Proposta
- **Data:** 2026-11-22
- **Área:** Frontend

## Contexto

A interface precisa ser simples (RNF-11), acessível (RNF-09), com tema escuro, e igual nas três plataformas.

## Decisão

- NativeWind (classes estilo Tailwind) para estilos, com tokens de design (cores, espaçamento, tipografia) centralizados.
- Componentes base em `shared/ui` (Button, Text, Card, Sheet, ProgressRing), sem lógica de domínio.
- Tema claro/escuro desde a v1; fonte ajustável; contraste AA verificado nos tokens.
- Ícones: um único pacote (ex.: Material Symbols).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Tamagui | Poderoso, mas mais complexo de configurar. |
| Biblioteca pronta (Paper, gluestack) | Visual genérico e difícil de personalizar. |

## Consequências

**Positivas**

- Rápido de estilizar e consistente.

**Negativas / riscos**

- Componentes base próprios para escrever.

## Relacionados

RNF-09, RNF-11
