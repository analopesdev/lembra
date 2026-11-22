# Lembra — Frontend (Expo: Web, Android e iOS)

Documento de arquitetura do app. Define a organização do código, as camadas, como lidar com diferenças entre plataformas, como testar e quais convenções seguir. **Leia antes de criar uma feature nova ou mexer em dados/sincronização.**

> Contexto do produto: documento de requisitos (RF/RNF/RN) e página "Arquitetura e modelo de dados" no Notion. Backend: `BACKEND.md`.

---

## 1. Princípios

1. **Local-first:** a interface lê e escreve **só no banco local**. A rede é um detalhe de fundo (sincronização e IA). O app funciona offline por padrão.
2. **Regra de negócio fora do React:** agendamento, valor da revisão, sequência e modo prova são funções TypeScript puras, testáveis sem renderizar nada.
3. **Um código, três plataformas:** diferenças de plataforma ficam isoladas em adaptadores (`*.native.ts` / `*.web.ts`), nunca espalhadas em `if (Platform.OS === ...)` pela interface.
4. **Telas finas:** uma tela (rota) só compõe componentes e chama hooks. Lógica vai para a feature.
5. **Contratos gerados:** tipos da API vêm do `openapi.yaml`; vetores de teste do FSRS são compartilhados com o backend.

---

## 2. Stack

| Camada | Escolha | Observação |
|---|---|---|
| Framework | Expo (SDK estável atual) + React Native + TypeScript `strict` | Web via react-native-web |
| Navegação | Expo Router (rotas por arquivo) | Mesmas rotas em web e mobile; deep links |
| Banco local | SQLite: `expo-sqlite` no mobile; `wa-sqlite`/OPFS na web | `expo-sqlite` na web ainda é alpha: isolar atrás de uma interface (seção 5) |
| Acesso a dados | Drizzle ORM (schema e migrações tipadas) | Validar no spike da semana 1; plano B: SQL tipado à mão |
| Agendamento | `ts-fsrs` | Envolvido pelo módulo `domain/scheduling` |
| Estado de UI | Zustand (estado efêmero: sessão em andamento, rascunhos de formulário) | Dados persistidos **não** vão para o Zustand |
| Dados reativos | Hooks de consulta reativa sobre o banco local (live queries) | A tela atualiza quando o banco muda (ex.: após sync) |
| Chamadas ao servidor | Cliente gerado com `openapi-typescript` + `openapi-fetch`; TanStack Query só para chamadas online (IA, jobs) | |
| Editor de cards | 10tap-editor (TipTap) | Saída em JSON de blocos (conteúdo rico) |
| Mídia | `expo-image`, `expo-audio`, `expo-video`, `expo-camera`, `expo-image-manipulator` | |
| Notificações | `expo-notifications` | Web: suporte limitado, tratar como opcional |
| Estilo | Tokens de design + componentes próprios em `shared/ui` (ex.: Tamagui ou NativeWind) | Escolher um só e não misturar |
| Formulários/validação | React Hook Form + Zod | Zod também valida respostas da API |
| i18n | `i18next` (pt-BR padrão) | Nenhum texto fixo em componente |
| Build e lojas | EAS Build / EAS Submit / EAS Update | Web: export estático (Cloudflare Pages) |

---

## 3. Camadas

```
 app/ (rotas)          ← telas finas: layout + composição
      │
      ▼
 features/*            ← UI da feature + hooks (casos de uso do lado do cliente)
      │
      ├──────────────► domain/      ← regras puras (sem React, sem I/O)
      ▼
 data/                 ← repositórios, banco local, sync, cliente da API, adaptadores de plataforma
      │
      ▼
 shared/               ← design system, utilitários, i18n (pode ser usado por todos)
```

### Regra de dependência (verificada no lint)

| Camada | Pode importar | Não pode importar |
|---|---|---|
| `app/` (rotas) | `features`, `shared` | `data` diretamente |
| `features/x` | `domain`, `data` (só pelas interfaces públicas), `shared`, outras features **só pelo `index.ts`** | Arquivos internos de outra feature |
| `domain/` | Nada além de `ts-fsrs` e utilitários puros | React, Expo, `data`, `features` |
| `data/` | `domain` (tipos), `shared/lib` | `features`, `app`, React (exceto hooks de dados em `data/hooks`) |
| `shared/` | Nada do projeto | `features`, `data`, `domain` |

Aplicado com `eslint-plugin-boundaries` (ou `import/no-restricted-paths`). PR que viola a regra não passa no CI.

---

## 4. Estrutura de pastas

```
apps/mobile/
├── app/                          # Expo Router
│   ├── _layout.tsx               # providers (banco, tema, i18n, auth)
│   ├── (tabs)/
│   │   ├── index.tsx             # Hoje
│   │   ├── quizzes.tsx
│   │   ├── colecoes.tsx
│   │   └── progresso.tsx
│   ├── revisao/[sessionId].tsx
│   ├── card/[id].tsx
│   ├── adicionar.tsx
│   └── onboarding/...
├── src/
│   ├── domain/
│   │   ├── scheduling/           # wrapper do ts-fsrs, derivação do estado (RN-12)
│   │   ├── session/              # valor da revisão (RN-01), dívida (RN-02), montagem da sessão
│   │   ├── grading/              # mapeamento resultado → nota (RN-03), comparação exata
│   │   ├── habit/                # dia válido (RN-04), congelamentos
│   │   ├── exam/                 # modo prova (RN-05)
│   │   ├── memory/               # memória retida (RN-06)
│   │   ├── quality/              # filtro de qualidade (RN-07)
│   │   ├── quiz/                 # efeito do quiz no card (RN-09), alternativas (RN-10)
│   │   └── types.ts              # Card, Review, Collection... (tipos puros)
│   ├── data/
│   │   ├── db/
│   │   │   ├── schema.ts         # Drizzle schema
│   │   │   ├── migrations/
│   │   │   ├── client.native.ts  # expo-sqlite
│   │   │   └── client.web.ts     # wa-sqlite / OPFS
│   │   ├── repositories/         # interfaces + implementações
│   │   │   ├── cards.ts          # interface CardsRepository
│   │   │   ├── cards.sqlite.ts   # implementação
│   │   │   └── ...
│   │   ├── sync/                 # outbox, push/pull, resolução de conflitos
│   │   ├── api/                  # cliente gerado do OpenAPI + auth (tokens, refresh)
│   │   ├── media/                # upload por URL assinada, cache local, compressão
│   │   ├── platform/             # notificações, armazenamento seguro, áudio (.native/.web)
│   │   └── container.ts          # monta as dependências (composition root do app)
│   ├── features/
│   │   ├── today/                # tela Hoje
│   │   ├── review-session/       # sessão de revisão
│   │   ├── card-editor/
│   │   ├── card-generation/      # envio de material, rascunhos, aprovação
│   │   ├── collections/
│   │   ├── quizzes/
│   │   ├── progress/
│   │   ├── onboarding/
│   │   └── settings/
│   │       # cada feature:
│   │       #   components/  hooks/  index.ts (API pública)  __tests__/
│   └── shared/
│       ├── ui/                   # design system: Button, Card, Text, tokens
│       ├── lib/                  # datas, ids (UUIDv7), formatação
│       └── i18n/
├── e2e/
│   ├── maestro/                  # fluxos mobile
│   └── playwright/               # fluxos web
├── app.config.ts
└── package.json
contracts/                        # raiz do monorepo, compartilhado com o backend
├── openapi.yaml
└── fsrs-vectors/*.json
```

---

## 5. Dados, offline e sincronização

### 5.1 Repositórios por interface

Toda leitura e escrita passa por um repositório definido como interface. A UI nunca escreve SQL.

```ts
// src/data/repositories/cards.ts
export interface CardsRepository {
  get(id: Id): Promise<Card | null>;
  watchDue(now: Date): Observable<CardWithState[]>;   // consulta reativa
  save(card: Card): Promise<void>;                    // grava + enfileira no outbox
  approveDrafts(ids: Id[]): Promise<void>;
}
```

Benefícios: dá para testar features com um repositório em memória, e trocar a implementação da web (ex.: de wa-sqlite para outra) sem tocar nas telas.

### 5.2 Escrita local + outbox

1. A ação do usuário grava no SQLite **e** adiciona a mudança na tabela `outbox` na mesma transação.
2. O motor de sync envia o outbox (`POST /v1/sync/push`) quando há rede, em lotes, com `idempotency_key`.
3. Periodicamente (e ao voltar para o app) faz `GET /v1/sync/pull?cursor=` e aplica as mudanças.
4. As telas, por usarem consultas reativas, se atualizam sozinhas.

### 5.3 Regras de conflito (iguais às do backend)

| Dado | Regra |
|---|---|
| Revisões, tentativas de quiz | Append-only: união |
| Estado FSRS do card | **Recalculado do histórico** (RN-12); nunca sincronizado como fonte |
| Cards, coleções, questões, configurações | Última edição vence (`updatedAt`, desempate por `deviceId`) |
| Exclusões | `deletedAt` (marcação) |

### 5.4 IA offline

Respostas digitadas sem rede entram numa fila `pending_grades`. Sem rede, o app oferece dar a nota manualmente; quando a nota da IA chegar, ela **não** sobrescreve uma nota manual.

### 5.5 Mídias

- Comprimidas ao salvar (imagem WebP até 1600 px; áudio em formato compacto) e guardadas no sistema de arquivos local.
- Upload em segundo plano por URL assinada; o card referencia o `mediaId`, não a URL.
- Cota monitorada; aviso a 80% (RNF-12).

---

## 6. Diferenças de plataforma

Use **extensões de arquivo**, que o bundler escolhe automaticamente:

```
data/platform/notifications.native.ts   # expo-notifications
data/platform/notifications.web.ts      # Web Push ou no-op
data/platform/notifications.ts          # interface + tipos
```

Regras:
- `Platform.OS` só é permitido dentro de `data/platform` e `shared/ui`.
- Cada adaptador de plataforma tem **o mesmo conjunto de testes de contrato** (seção 7).
- Recursos sem suporte numa plataforma degradam com elegância (ex.: notificação na web vira lembrete na tela Hoje).

---

## 7. Estratégia de testes

| Nível | O que testa | Ferramenta | Onde |
|---|---|---|---|
| Domínio | RN-01 a RN-12 | Jest (`jest-expo`) + `fast-check` (propriedades) | `src/domain/**/__tests__` |
| Conformidade FSRS | ts-fsrs = go-fsrs | Jest lendo `contracts/fsrs-vectors` | `src/domain/scheduling` |
| Contrato de repositório | Implementações SQLite (native e web) e em memória se comportam igual | Mesma suíte rodando contra cada implementação | `src/data/repositories/__tests__` |
| Sync | Merge comutativo e idempotente; outbox sobrevive a falhas | `fast-check` + servidor falso (MSW) | `src/data/sync/__tests__` |
| Hooks e componentes | Comportamento da feature | React Native Testing Library + repositórios em memória | `src/features/*/__tests__` |
| API | Cliente trata erros e refresh | MSW com respostas do OpenAPI | `src/data/api/__tests__` |
| E2E mobile | Onboarding, sessão de 10 min, gerar cards, quiz, modo avião | Maestro | `e2e/maestro` |
| E2E web | Mesmos fluxos | Playwright | `e2e/playwright` |
| Acessibilidade | Rótulos, contraste, foco | `eslint-plugin-react-native-a11y` + revisão manual | CI + PR |

### Regras de teste

- Todo `domain/` usa **relógio injetado** (`now` como parâmetro); nada de `new Date()` dentro de regra.
- Features são testadas com o `container` de teste (repositórios em memória + API falsa), sem banco real.
- Critérios de aceite da v1 viram fluxos E2E (ex.: "sessão de 10 min termina entre 10 e 11 min").
- Cobertura mínima: `domain` 90%, `data/sync` 85%, features 70%.

---

## 8. Convenções

- TypeScript `strict`, sem `any` (lint com `@typescript-eslint/no-explicit-any`).
- Imports absolutos: `@/domain/...`, `@/features/...`.
- Nomes: componentes `PascalCase.tsx`, hooks `useAlgo.ts`, funções de domínio verbos (`buildSession`, `isValidDay`).
- Cada feature expõe só o que está no seu `index.ts`.
- Componentes de `shared/ui` não conhecem domínio (recebem dados prontos).
- Datas sempre em UTC no banco; conversão para o fuso do usuário só na exibição.
- Textos em `i18n`; números e datas formatados com `Intl` (pt-BR).
- Acessibilidade: todo elemento tocável tem `accessibilityLabel`; contraste AA; fonte ajustável (RNF-09).
- Prettier + ESLint no pre-commit (lint-staged).

---

## 9. Desempenho (RNF-03)

- Tela Hoje < 1 s com 10 mil cards: índices em `due`, `collection_id`, `deleted_at`; memória retida calculada incrementalmente e guardada em cache.
- Troca de card < 100 ms: a sessão pré-carrega os próximos 3 cards e suas mídias.
- Listas longas com `FlashList`.
- Trabalho pesado (recalcular estados após sync grande) fora da thread de UI, em lotes.

---

## 10. Como evoluir sem quebrar

- **Nova feature:** crie `src/features/<nome>/` com `components/`, `hooks/`, `index.ts`, `__tests__/`; adicione a rota em `app/`.
- **Nova regra de negócio:** comece com o teste em `domain/`; se o backend também usa a regra, adicione vetores em `contracts/`.
- **Mudança no banco local:** nova migração Drizzle + teste que migra a partir da versão anterior com dados.
- **Mudança na API:** edite `contracts/openapi.yaml`, regenere o cliente (`npm run gen:api`), ajuste os repositórios.
- **Atualização do Expo:** uma vez por ciclo de SDK, em branch própria, com E2E completo antes do merge.
- **Funções da v2:** atrás de feature flags vindas do servidor.

---

## 11. Scripts

```
npm run dev           # expo start (web, Android, iOS)
npm run gen:api       # gera o cliente a partir de contracts/openapi.yaml
npm run db:generate   # gera migração Drizzle
npm test              # unitários + contrato
npm run e2e:web       # Playwright
npm run e2e:mobile    # Maestro
npm run lint          # ESLint (inclui regras de camadas) + tsc --noEmit
```

---

## 12. Checklist de PR

- [ ] Regra nova está em `domain/` e tem teste
- [ ] Tela não acessa `data/` diretamente nem contém regra de negócio
- [ ] Escrita passa por repositório e entra no outbox
- [ ] Funciona em modo avião (quando aplicável)
- [ ] Testado em web, Android e iOS (ou E2E cobre)
- [ ] Textos em i18n e elementos com rótulo de acessibilidade
- [ ] Cliente da API regenerado se o contrato mudou
