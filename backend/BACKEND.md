# Lembra — Backend (Go)

Documento de arquitetura do backend. Define como o código é organizado, como as partes conversam, como testar e quais convenções seguir. **Leia antes de criar um módulo novo ou mudar uma fronteira.**

> Contexto do produto: veja o documento de requisitos (RF/RNF/RN) e a página "Arquitetura e modelo de dados" no Notion.

---

## 1. Papel do backend

O app é **local-first**: o celular/navegador guarda os dados e funciona offline. O backend existe para:

| Responsabilidade | Por quê no servidor |
|---|---|
| Autenticação (e-mail, Google, Apple) | Identidade única entre aparelhos |
| Sincronização entre aparelhos | Web, Android e iOS veem os mesmos dados |
| Proxy da IA (gerar cards, dar nota, criar quizzes) | A chave da API nunca vai para o aparelho; controle de custo |
| Mídias (imagem, áudio, vídeo) | Armazenamento em objeto (R2/S3) com URL assinada |
| Tarefas pesadas (PDF, geração em lote) | Rodam em fila, fora da requisição |
| Fonte da verdade do histórico de revisões | Estado FSRS é **derivado** do histórico (RN-12) |

O backend **não** decide a sessão do dia: isso roda no aparelho (offline). O servidor recalcula e valida.

---

## 2. Estilo arquitetural

**Monólito modular + arquitetura hexagonal (ports & adapters) dentro de cada módulo.**

- **Monólito modular:** um único binário, dividido em módulos de domínio independentes (`cards`, `review`, `quiz`…). Simples de implantar, fácil de extrair um módulo no futuro se precisar.
- **Hexagonal:** em cada módulo, a regra de negócio fica no centro e não conhece banco, HTTP nem IA. Ela fala com o mundo por **interfaces (ports)**; as implementações concretas (**adapters**) ficam na borda.

```
           HTTP / Worker (adapters de entrada)
                         │
                         ▼
               ┌───────────────────┐
               │   app (casos de   │  ← orquestra, transações, autorização
               │   uso / serviços) │
               │  ┌─────────────┐  │
               │  │   domain    │  │  ← regras puras, sem I/O
               │  └─────────────┘  │
               └─────────┬─────────┘
                         │ interfaces (ports)
                         ▼
     Postgres · R2 · Claude API · Relógio (adapters de saída)
```

### Regra de dependência (inegociável)

```
adapters  →  app  →  domain
```

- `domain` não importa nada do projeto além de `internal/kernel`.
- `app` importa `domain` e declara as interfaces de que precisa.
- `adapters` importam `app`/`domain` e implementam as interfaces.
- **Módulos não importam o `domain` ou os `adapters` de outro módulo.** Comunicação entre módulos: pela API pública do módulo (`<modulo>/app` expõe um `Service`) ou por eventos internos.
- A regra é verificada no CI com `go-arch-lint` (ou `depguard` do golangci-lint).

---

## 3. Estrutura de pastas

```
backend/
├── cmd/
│   ├── api/            # main do servidor HTTP: lê config, monta dependências, sobe o servidor
│   └── worker/         # main do worker da fila (River)
├── internal/
│   ├── kernel/         # tipos compartilhados mínimos: IDs (UUIDv7), Clock, erros base, paginação
│   ├── platform/       # infraestrutura transversal (sem regra de negócio)
│   │   ├── config/     # leitura de env (12-factor)
│   │   ├── db/         # pool pgx, transações, helpers
│   │   ├── httpx/      # roteador, middlewares (auth, request-id, logging, rate limit, recover)
│   │   ├── observ/     # slog + OpenTelemetry
│   │   ├── queue/      # cliente River
│   │   └── storage/    # cliente S3/R2, URLs assinadas
│   └── modules/
│       ├── auth/
│       ├── collections/
│       ├── cards/
│       ├── sources/    # upload e extração de PDF/texto/foto/áudio
│       ├── media/
│       ├── review/     # histórico de revisões, derivação do estado FSRS
│       ├── quiz/
│       ├── habit/      # sequência, dias válidos, congelamentos
│       ├── ai/         # porta única para LLM: prompts, validação, custo
│       └── sync/       # push/pull entre aparelhos

├── db/
│   ├── migrations/     # goose: 0001_init.sql, ...
│   └── queries/        # SQL por módulo para o sqlc
├── prompts/            # prompts versionados (ex.: grade_answer.v3.md)
├── test/
│   ├── integration/    # testes com Postgres real (testcontainers)
│   ├── e2e/            # sobe a API e chama via HTTP
│   └── fixtures/
├── Makefile
└── go.mod
```

### Anatomia de um módulo

```
internal/modules/cards/
├── domain/
│   ├── card.go            # entidade Card, invariantes, construtores
│   ├── quality.go         # filtro de qualidade (RN-07) — função pura
│   ├── errors.go          # ErrCardNotFound, ErrInvalidImportance...
│   └── quality_test.go
├── app/
│   ├── service.go         # casos de uso: Create, Update, ApproveDrafts, Generate...
│   ├── ports.go           # interfaces que o app precisa (Repository, AIGenerator, Clock)
│   ├── service_test.go    # testes com fakes
│   └── fakes_test.go
└── adapters/
    ├── http/
    │   ├── handler.go     # traduz HTTP <-> casos de uso (sem regra de negócio)
    │   └── dto.go         # tipos gerados do OpenAPI + mapeamento
    └── postgres/
        ├── repo.go        # implementa app.Repository usando sqlc
        └── repo_test.go   # integração (build tag `integration`)
```

---

## 4. Padrões de código

### 4.1 Interfaces pequenas, definidas por quem consome

```go
// internal/modules/cards/app/ports.go
package app

type Repository interface {
    Get(ctx context.Context, userID, cardID kernel.ID) (domain.Card, error)
    Save(ctx context.Context, c domain.Card) error
    ListDrafts(ctx context.Context, userID kernel.ID, sourceID kernel.ID) ([]domain.Card, error)
}

type CardGenerator interface { // implementado pelo módulo ai
    Generate(ctx context.Context, in GenerateInput) ([]domain.CardDraft, error)
}
```

### 4.2 Injeção de dependência explícita

Sem framework de DI. Tudo é montado em `cmd/api/main.go` (o "composition root"):

```go
db := db.MustConnect(cfg.DatabaseURL)
clock := kernel.SystemClock{}
llm := claude.NewClient(cfg.AnthropicKey)

cardsRepo := cardspg.NewRepo(db)
aiSvc := aiapp.NewService(llm, prompts.FS, clock)
cardsSvc := cardsapp.NewService(cardsRepo, aiSvc, clock)

router.Mount("/v1/cards", cardshttp.NewHandler(cardsSvc))
```

### 4.3 Tempo e IDs são dependências

Regras como sequência (RN-04), modo prova (RN-05) e vencimento dependem de "agora". **Nunca chame `time.Now()` em `domain` ou `app`**: receba um `kernel.Clock`. IDs são **UUIDv7 gerados no cliente** (permitem criar offline e ordenam por tempo).

### 4.4 Erros

- `domain` define erros sentinela (`var ErrCardNotFound = errors.New(...)`) ou tipos de erro.
- `app` envolve com contexto (`fmt.Errorf("approve drafts: %w", err)`).
- `adapters/http` traduz para HTTP com **RFC 9457 (problem+json)** num único lugar (`httpx.WriteError`).

### 4.5 Transações

O caso de uso define o limite da transação via `db.WithTx(ctx, func(tx) error {...})`. Repositórios aceitam uma interface `db.Querier` (pool ou tx), então o mesmo repositório funciona dentro e fora de transação.

### 4.6 Contexto, logs e observabilidade

- Todo método de I/O recebe `ctx context.Context` como primeiro parâmetro.
- Logs estruturados com `log/slog` (JSON em produção), sempre com `request_id` e `user_id`.
- OpenTelemetry para traces (HTTP, SQL, chamadas à IA) e métricas de custo de IA por usuário.

---

## 5. Decisões de domínio que afetam a arquitetura

### RN-12 — Estado FSRS derivado do histórico

- A tabela `review_logs` é **append-only** (nunca há UPDATE/DELETE).
- O estado de cada card (`estabilidade`, `dificuldade`, `vencimento`…) é **recalculado** a partir do histórico com `go-fsrs`, e guardado em `card_states` como cache.
- Consequência: sincronizar revisões vira **união de conjuntos** (sem conflito), e cliente e servidor sempre chegam ao mesmo estado.
- **Testes de conformidade:** `contracts/fsrs-vectors/*.json` contém sequências de revisões e o estado esperado. O backend (go-fsrs) e o frontend (ts-fsrs) rodam os mesmos vetores no CI. Se divergirem, o build quebra.

### Sincronização (módulo `sync`)

| Tipo de dado | Estratégia |
|---|---|
| Revisões, tentativas de quiz | Append-only: união |
| Cards, coleções, questões, configurações | "Última edição vence" por registro (`updated_at` + `device_id` para desempate) |
| Exclusões | Marcação (`deleted_at`), nunca apagar de fato no sync |
| Mídias | Metadados no sync; arquivo enviado direto ao R2 por URL assinada |

Endpoints: `POST /v1/sync/push` (lote de mudanças com `idempotency_key`) e `GET /v1/sync/pull?cursor=` (mudanças desde o cursor). Ambos são idempotentes.

### Módulo `ai` (porta única para LLM)

- Nenhum outro módulo chama a API da Anthropic diretamente; todos usam `ai/app.Service`.
- Prompts ficam em `prompts/` com versão no nome; a versão usada é gravada junto do resultado (permite comparar versões).
- Saída **sempre em JSON validado contra schema**; resposta inválida → 1 nova tentativa → erro tipado.
- Modelo rápido para nota (RN-03); modelo mais forte para gerar cards/quizzes.
- Respostas exatas (números, datas, termos curtos) são avaliadas por comparação, **sem IA** (RNF-05).
- Registro de tokens e custo por chamada; limite mensal configurável.

### Tarefas assíncronas

Gerar cards de um PDF, gerar quiz e processar mídia rodam no **worker** via River (fila sobre o próprio Postgres; sem Redis). A API cria o job e devolve `202 Accepted` com um `job_id`; o app consulta `GET /v1/jobs/{id}` ou recebe o resultado no próximo pull.

---

## 6. Estratégia de testes

Objetivo: **a maior parte da lógica testada sem banco, sem rede e em milissegundos.**

| Nível | O que testa | Como | Onde | Roda em |
|---|---|---|---|---|
| Unitário de domínio | Regras puras (RN-01 a RN-12) | Testes de tabela; `rapid` para testes de propriedade | `domain/*_test.go` | Todo commit |
| Caso de uso | Orquestração, autorização, erros | **Fakes escritos à mão** (não mocks gerados) + `FakeClock` | `app/*_test.go` | Todo commit |
| Integração | SQL, migrações, R2 | `testcontainers-go` (Postgres, MinIO) | `adapters/postgres/*_test.go`, build tag `integration` | CI |
| Contrato HTTP | Handlers seguem o `openapi.yaml` | Validador `kin-openapi` em cada resposta de teste | `adapters/http/*_test.go` | Todo commit |
| Conformidade FSRS | Go e TS geram o mesmo estado | Vetores em `contracts/fsrs-vectors` | `review/domain` | CI |
| IA | Prompts e parsing | Fake do LLM + respostas gravadas (golden files); avaliação manual com conjunto de 100 respostas (critério de aceite: 85% de concordância) | `ai/` | Todo commit / manual |
| E2E | Fluxos principais | Sobe API + Postgres; cliente HTTP gerado | `test/e2e` | CI (main) |

### Regras de teste

- Testes de propriedade obrigatórios para: merge do sync (comutativo e idempotente), derivação FSRS (mesmo histórico → mesmo estado), RN-01 (ordem estável).
- Um bug corrigido = um teste que falharia antes.
- Sem `time.Sleep` em teste: use `FakeClock`.
- Cobertura mínima: `domain` 90%, `app` 80%. Adapters medidos por integração, não por porcentagem.

---

## 7. API

- **Contrato primeiro:** edite `contracts/openapi.yaml`, gere código com `oapi-codegen` (servidor Go) e `openapi-typescript` (cliente do app).
- Versionamento no caminho: `/v1/...`. Mudança incompatível → `/v2` para o recurso afetado.
- Autenticação: token de acesso curto (15 min) + refresh token rotativo; login com e-mail, Google e **Sign in with Apple** (obrigatório na App Store quando há login social).
- Paginação por cursor; filtros explícitos; respostas de erro em problem+json.
- Rate limit por usuário, com limite mais rígido nos endpoints de IA.

---

## 8. Dados

- PostgreSQL com `pgx` + `sqlc` (SQL escrito à mão, código Go gerado e tipado).
- Migrações com `goose`, apenas para frente; toda migração tem teste de integração.
- Toda tabela de usuário tem `user_id`, `created_at`, `updated_at`, `deleted_at`.
- Mídias: só metadados no Postgres; arquivos no R2 com chave `users/{user_id}/media/{media_id}`.

---

## 9. Ferramentas e qualidade

| Ferramenta | Uso |
|---|---|
| Go (versão estável atual) | Linguagem |
| `golangci-lint` | Lint (inclui `depguard`/regras de arquitetura, `errcheck`, `gosec`) |
| `sqlc`, `goose`, `oapi-codegen` | Geração de código e migrações |
| `testcontainers-go`, `rapid`, `kin-openapi` | Testes |
| River | Fila de tarefas sobre Postgres |
| Docker Compose | Postgres + MinIO locais |

### Makefile (alvos padrão)

```
make dev          # sobe dependências e a API com reload
make gen          # sqlc + oapi-codegen
make test         # unitários + contrato (rápidos)
make test-int     # integração com containers
make lint         # golangci-lint + regras de arquitetura
make migrate-up   # aplica migrações
```

### CI (a cada PR)

`lint` → `gen` (falha se o código gerado mudou) → `test` → `test-int` → testes de conformidade FSRS → build das imagens.

---

## 10. Como evoluir sem quebrar

- **Novo módulo:** copie a anatomia da seção 3, registre no `main.go`, adicione a regra de dependência no lint.
- **Nova regra de negócio:** comece pelo teste em `domain`, depois o caso de uso, por último o adapter.
- **Trocar uma tecnologia** (ex.: outro provedor de IA ou de storage): implemente a mesma interface num novo adapter; o resto do código não muda.
- **Decisão relevante:** registre um ADR em `docs/adr/` (contexto, decisão, consequências).
- **Feature flags** simples por usuário (tabela `flags`) para ligar funções da v2 aos poucos.

---

## 11. Checklist de PR

- [ ] Regra nova tem teste em `domain` ou `app`
- [ ] Nenhum `time.Now()`, SQL ou HTTP dentro de `domain`/`app`
- [ ] `openapi.yaml` atualizado e código regenerado
- [ ] Migração tem teste e é compatível com a versão anterior do app
- [ ] Erros mapeados para problem+json
- [ ] Logs sem dados sensíveis (respostas do usuário, chaves)
- [ ] ADR criado se mudou uma fronteira ou tecnologia
