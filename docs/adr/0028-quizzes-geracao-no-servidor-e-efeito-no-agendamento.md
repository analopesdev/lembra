# ADR-0028: Quizzes: geração no servidor e efeito no agendamento

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Domínio

## Contexto

Quizzes (RF-56 a RF-66) testam reconhecimento, que fixa menos que recordação. Não podem distorcer o FSRS nem trazer gabaritos errados.

## Decisão

- Geração por job no servidor, a partir de cards e fontes; alternativas erradas vêm de outros cards da coleção (RN-10).
- Cada questão guarda `card_id` (quando houver) e trecho da fonte.
- Efeito no FSRS só pela regra RN-09 (erro → "De novo"; acerto só conta perto do vencimento; múltipla escolha vale no máximo "Difícil").
- "Gabarito errado" remove a questão na hora e cria tarefa de correção.
- Quiz respondido offline: tentativa salva localmente e sincronizada (append-only).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Quiz independente do FSRS | Desperdiça o sinal de erro. |
| Quiz como revisão normal | Infla a memória com acertos por reconhecimento. |

## Consequências

**Positivas**

- Quizzes úteis sem prejudicar a memória real.

**Negativas / riscos**

- Regra extra no domínio dos dois lados (coberta por vetores).

## Relacionados

RN-09, RN-10, ADR-0013
