# ADR-0023: Observabilidade e monitoramento de erros

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Operação

## Contexto

É preciso descobrir rápido bugs de sync, falhas de IA e custo, sem expor dados pessoais.

## Decisão

- Backend: `log/slog` em JSON com `request_id` e `user_id`; OpenTelemetry para traces de HTTP, SQL e IA.
- Métricas: latência por endpoint, erros, duração de jobs, tokens e custo de IA por dia.
- App: Sentry para crashes e erros (web e mobile), com filtro de dados sensíveis.
- Nunca registrar respostas digitadas, conteúdo de cards ou tokens nos logs.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Sem monitoramento | Bugs de sync seriam invisíveis. |

## Consequências

**Positivas**

- Diagnóstico rápido; custo de IA visível.

**Negativas / riscos**

- Configurar e manter o coletor (plano gratuito de um provedor resolve na v1).

## Relacionados

ADR-0025
