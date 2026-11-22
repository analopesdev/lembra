# ADR-0002: Arquitetura local-first

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Arquitetura

## Contexto

O app precisa funcionar offline (RNF-01), abrir a tela Hoje em menos de 1 s (RNF-03) e nunca perder dados (RNF-07). Depender do servidor a cada ação deixaria o app lento e inútil sem rede.

## Decisão

- A interface lê e escreve **somente no banco local** do aparelho.
- O servidor é usado para: sincronizar entre aparelhos, autenticar, chamar a IA, guardar mídias e rodar tarefas pesadas.
- A montagem da sessão do dia, o agendamento e as regras de hábito rodam **no aparelho**.
- O servidor recalcula e valida o que importa (estado FSRS, dias válidos) a partir dos dados sincronizados.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Cliente fino com API online | Não atende offline nem desempenho. |
| Só local, sem servidor | Não atende web + Android + iOS com os mesmos dados nem esconde a chave da IA. |

## Consequências

**Positivas**

- Experiência instantânea e offline.
- Servidor simples: sem lógica de sessão em tempo real.

**Negativas / riscos**

- Exige motor de sincronização e regras de conflito (ADR-0008).
- Regras de negócio existem em dois lugares (TS e Go), mitigado por vetores de conformidade (ADR-0006).

## Relacionados

ADR-0007, ADR-0008, ADR-0010
