# ADR-0024: Hospedagem, CI/CD e ambientes

- **Status:** Proposta
- **Data:** 2026-11-22
- **Área:** Operação

## Contexto

Infra barata, simples de operar por uma pessoa, com deploy automático.

## Decisão

- Backend (API + worker): Fly.io ou Railway, em contêiner Docker.
- Banco: Postgres gerenciado (Neon ou Supabase). Mídias: Cloudflare R2.
- Web: export estático na Cloudflare Pages.
- Mobile: EAS Build/Submit; EAS Update para correções de JS.
- CI/CD: GitHub Actions com filtros por caminho; deploy automático do `main` para produção após testes.
- Ambientes: `local` (Docker Compose) e `prod`; `staging` só quando houver outros usuários.
- Segredos em variáveis do provedor; nunca no repositório.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Kubernetes | Exagero para a escala. |
| AWS completa | Mais configuração e custo de aprendizado. |

## Consequências

**Positivas**

- Custo baixo e operação mínima.

**Negativas / riscos**

- Dependência de provedores pequenos (contêineres facilitam migrar).

## Relacionados

ADR-0001
