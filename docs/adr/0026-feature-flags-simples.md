# ADR-0026: Feature flags simples

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Operação

## Contexto

Funções da v2 entram aos poucos e devem poder ser desligadas sem novo build nas lojas.

## Decisão

- Tabela `flags` no servidor (por usuário ou global), enviada ao app no pull.
- No app, `useFlag('nome')`; padrão desligado se a flag não chegar.
- Flags temporárias têm data de remoção registrada.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Serviço de flags (LaunchDarkly) | Custo desnecessário. |

## Consequências

**Positivas**

- Lançar e reverter funções sem passar pelas lojas.

**Negativas / riscos**

- Limpar flags antigas periodicamente.

## Relacionados

ADR-0008
