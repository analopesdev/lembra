# ADR-0025: Segurança e privacidade

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Segurança

## Contexto

O app guarda material de estudo e respostas do usuário e envia trechos para a IA (RNF-06).

## Decisão

- HTTPS em tudo; dados criptografados em repouso pelos provedores.
- Chave da IA só no servidor; para a IA vai só card, resposta e trecho.
- Autorização por `user_id` em toda consulta (teste de integração para cada repositório).
- URLs de mídia assinadas e de curta duração.
- Exportação completa e exclusão de conta disponíveis no app.
- Dependências verificadas no CI (`govulncheck`, `npm audit`), `gosec` no lint.
- Política de privacidade simples exigida pelas lojas.

## Consequências

**Positivas**

- Atende às lojas e protege os dados.

**Negativas / riscos**

- Checagens extras no CI.

## Relacionados

ADR-0012, ADR-0013, ADR-0016
