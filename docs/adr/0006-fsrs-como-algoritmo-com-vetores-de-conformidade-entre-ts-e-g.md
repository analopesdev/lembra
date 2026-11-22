# ADR-0006: FSRS como algoritmo, com vetores de conformidade entre TS e Go

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Domínio

## Contexto

O agendamento roda offline no aparelho (TypeScript) e é recalculado no servidor (Go). Duas implementações podem divergir silenciosamente.

## Decisão

- Algoritmo FSRS, mantido pela comunidade open-spaced-repetition.
- Cliente: `ts-fsrs`. Servidor: `go-fsrs`. Mesma versão do algoritmo e mesmos parâmetros nos dois lados.
- `contracts/fsrs-vectors/*.json`: sequências de revisões com o estado esperado. Os dois lados rodam esses vetores no CI; divergência quebra o build.
- Otimização automática dos parâmetros (RF-32) no servidor, a cada 500 revisões ou 30 dias; parâmetros sincronizados para o app. Se o `go-fsrs` não oferecer otimizador, usar o `fsrs-rs` (Rust) via binding num job do worker.
- Fixar versões das bibliotecas; atualizar só com vetores verdes.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| SM-2 | Mais antigo e menos eficiente; sofre de "ease hell". |
| Algoritmo próprio | Sem base científica nem benchmark. |
| Agendar só no servidor | Quebra o offline (ADR-0002). |

## Consequências

**Positivas**

- Algoritmo moderno e testado.
- Garantia automática de que cliente e servidor concordam.

**Negativas / riscos**

- Manter vetores atualizados ao mudar versões.

## Relacionados

ADR-0007, RN-01, RF-28, RF-32
