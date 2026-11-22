# ADR-0012: Autenticação: e-mail, Google e Apple com tokens curtos

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Segurança

## Contexto

O usuário entra em vários aparelhos. A App Store exige Sign in with Apple quando há login social e exige exclusão de conta dentro do app.

## Decisão

- Login por e-mail com código de uso único (sem senha) + Google + Sign in with Apple.
- Token de acesso JWT de 15 min + refresh token rotativo (guardado com hash no servidor, revogável por aparelho).
- No app: tokens em armazenamento seguro (`expo-secure-store`); na web, refresh em cookie HttpOnly.
- Exclusão de conta no app (RF de conformidade com lojas), apagando dados e mídias.
- Rate limit nos endpoints de login.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Auth de terceiros (Clerk, Auth0) | Custo e dependência; o escopo é pequeno. |
| Senha | Mais suporte e risco; código por e-mail é suficiente. |

## Consequências

**Positivas**

- Entrar em qualquer aparelho com facilidade.
- Atende às regras das lojas.

**Negativas / riscos**

- Implementar e manter o fluxo de tokens com cuidado (testes de integração obrigatórios).

## Relacionados

ADR-0025
