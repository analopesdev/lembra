# ADR-0014: Nota pela IA para respostas digitadas

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** IA

## Contexto

O usuário digita a resposta e a IA converte em nota FSRS (RN-03). Precisa ser rápido (RNF-04), barato e corrigível.

## Decisão

- Passo 1 no aparelho: normalização (minúsculas, acentos, espaços) e **comparação exata**; respostas curtas exatas (números, datas, termos) não chamam a IA.
- Passo 2 no servidor: chamada ao modelo rápido com pergunta, gabarito, trecho e resposta; retorna `{resultado, justificativa}`.
- Mapeamento resultado + tempo de resposta → nota, feito no **domínio**, não no prompt (RN-03).
- Correção manual sempre vence e é registrada como evento; taxa de correção monitorada para calibrar o prompt.
- Offline: resposta vai para `pending_grades`; o app oferece nota manual; nota da IA que chegar depois não sobrescreve a manual.
- Critério de aceite: concordância ≥ 85% em 100 respostas de teste.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Só botões (como o Anki) | Mantém o problema do 'Difícil' mal usado. |
| Embeddings/similaridade | Não entende respostas parcialmente corretas. |

## Consequências

**Positivas**

- Recordação ativa real e dados limpos para o FSRS.

**Negativas / riscos**

- Latência e custo por revisão (mitigados pela comparação exata e modelo rápido).

## Relacionados

ADR-0013, RN-03, RF-10 a RF-15
