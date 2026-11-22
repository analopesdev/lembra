# ADR-0013: IA via backend com a API do Claude e um módulo único

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** IA

## Contexto

A IA gera cards, filtra qualidade, dá nota a respostas e cria quizzes. A chave não pode ficar no aparelho, o custo precisa de controle (RNF-05) e a IA não pode inventar fora do material (RNF-08).

## Decisão

- Todas as chamadas passam pelo backend, no módulo `ai`; nenhum outro módulo chama a API diretamente.
- Porta `LLM` (interface) com adaptador para a API do Claude (SDK oficial em Go). Trocar de provedor = novo adaptador.
- Modelo por tarefa: rápido e barato para nota de resposta; mais forte para gerar cards e quizzes. Nomes de modelo em configuração, não no código.
- Prompts versionados em `backend/prompts/` (ex.: `grade_answer.v1.md`); a versão é gravada junto de cada resultado.
- Saída sempre em JSON validado contra schema; inválido → 1 nova tentativa → erro tipado.
- O prompt recebe só o necessário: card, resposta e trecho da fonte.
- Registro de tokens e custo por chamada; limite mensal configurável com bloqueio suave.
- Fake do LLM e respostas gravadas (golden files) nos testes.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Chamar a IA direto do app | Expõe a chave e impede controle de custo. |
| Modelo local no aparelho | Qualidade insuficiente para nota e geração hoje. |

## Consequências

**Positivas**

- Chave protegida, custo controlado, provedor trocável.

**Negativas / riscos**

- Nota e geração exigem rede (tratado com fila offline, ADR-0014).

## Relacionados

ADR-0014, ADR-0018, ADR-0028, RNF-05, RNF-06, RNF-08
