# ADR-0022: Notificações locais, no máximo uma por dia

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Frontend

## Contexto

Notificações aumentam a adesão, mas em excesso irritam (lição do Duolingo). Precisam funcionar offline.

## Decisão

- `expo-notifications` com **agendamento local** no aparelho, sem servidor de push na v2.
- No máximo 1 por dia, no horário habitual de estudo (aprendido do histórico), só se houver revisões de alto valor e o dia ainda não for válido.
- Texto concreto gerado no domínio (ex.: "6 min mantêm 42 cards acima de 90%").
- Web: sem notificação na v1; lembrete aparece na tela Hoje.
- Reagendar ao fim de cada sessão e após sync.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Push pelo servidor | Infra extra e não funciona offline. |
| Várias notificações | Contraria a decisão de produto (RF-39). |

## Consequências

**Positivas**

- Simples, offline e respeitoso.

**Negativas / riscos**

- Sem notificação na web.

## Relacionados

RF-39
