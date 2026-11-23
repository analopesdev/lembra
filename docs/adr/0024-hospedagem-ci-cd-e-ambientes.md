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
- **Cabeçalhos da web (ADR-0010):** o `expo-sqlite` na web precisa de `SharedArrayBuffer`. No `_headers` da Cloudflare Pages: `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: credentialless` onde suportado (Chromium, Firefox); fallback documentado para `require-corp` (Safari não suporta `credentialless` até onde sabemos: verificar no spike do Safari).
- R2: CORS configurado e `Cross-Origin-Resource-Policy: cross-origin` nos objetos servidos por URL assinada.
- YouTube (v2) na web: miniatura + link, sem iframe (iframes de terceiros quebram com COEP).

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
