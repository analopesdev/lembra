# ADR-0027: Dia do usuário, fuso horário e hábito

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Domínio

## Contexto

Sequência (RN-04), congelamentos e vencimentos dependem de "que dia é hoje". Quem estuda à meia-noite ou viaja não pode perder a sequência por erro de fuso.

## Decisão

- Datas guardadas em UTC; o "dia de estudo" é calculado no fuso do usuário com **virada às 4h da manhã** (estudar à 1h conta para o dia anterior).
- Fuso salvo nas configurações e atualizado quando o aparelho muda.
- Dia válido e congelamentos calculados no aparelho e **recalculados no servidor** a partir das sessões sincronizadas; o servidor é a fonte da verdade da sequência.
- Semana de congelamentos: segunda a domingo.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Dia em UTC | Sequência quebraria para quem estuda à noite no Brasil. |

## Consequências

**Positivas**

- Comportamento intuitivo; sem discussões entre aparelhos.

**Negativas / riscos**

- Testes com vários fusos (FakeClock + tabela de casos).

## Relacionados

RN-04, RF-37, RF-38
