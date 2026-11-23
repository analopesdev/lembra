# Decisões técnicas do Lembra (ADRs)

Cada arquivo registra **uma decisão técnica**: o contexto, o que foi decidido, as alternativas descartadas e as consequências. Juntas, elas descrevem tudo o que precisa ser desenvolvido no app (Expo) e no backend (Go).

## Como usar

- **Antes de implementar algo**, procure a ADR da área (tabela abaixo) e siga a decisão.
- **Status "Proposta"** = decisão provisória que depende de um spike (experimento curto). Se o spike falhar, use o plano B descrito na própria ADR e atualize o status.
- **Para mudar uma decisão**, não edite a antiga: crie uma nova ADR e marque a anterior como "Substituída por ADR-XXXX".
- **Nova decisão**: copie `0000-template.md`, use o próximo número e adicione na tabela.
- Documentos relacionados: `BACKEND.md`, `FRONTEND.md` e o documento de requisitos (RF/RNF/RN).

## Spikes pendentes (validar primeiro)

| Semana | Spike | ADR | Critério de sucesso |
|---|---|---|---|
| 1 ✔ | Banco local SQLite na web + consultas reativas | ADR-0010 | CRUD e tela Hoje < 1 s com 10 mil cards na web |
| 1 ✔ | Conformidade ts-fsrs × go-fsrs | ADR-0006 | Mesmos estados em 100% dos vetores |
| 3 | Geração com trecho de origem (citações) | ADR-0018 | Trecho literal correto em ≥ 95% dos cards de teste |
| 3 | Nota pela IA | ADR-0014 | Concordância ≥ 85% em 100 respostas |

## Índice

| ADR | Decisão | Área | Status |
|---|---|---|---|
| [ADR-0001](0001-monorepo-com-app-backend-e-contratos.md) | Monorepo com app, backend e contratos | Organização | Aceita |
| [ADR-0002](0002-arquitetura-local-first.md) | Arquitetura local-first | Arquitetura | Aceita |
| [ADR-0003](0003-expo-react-native-para-web-android-e-ios.md) | Expo (React Native) para web, Android e iOS | Frontend | Aceita |
| [ADR-0004](0004-go-com-monolito-modular-e-arquitetura-hexagonal.md) | Go com monólito modular e arquitetura hexagonal | Backend | Aceita |
| [ADR-0005](0005-postgresql-com-pgx-sqlc-e-goose.md) | PostgreSQL com pgx, sqlc e goose | Backend | Aceita |
| [ADR-0006](0006-fsrs-como-algoritmo-com-vetores-de-conformidade-entre-ts-e-g.md) | FSRS como algoritmo, com vetores de conformidade entre TS e Go | Domínio | Aceita |
| [ADR-0007](0007-estado-fsrs-derivado-de-historico-append-only-rn-12.md) | Estado FSRS derivado de histórico append-only (RN-12) | Domínio | Aceita |
| [ADR-0008](0008-sincronizacao-outbox-push-pull-e-regras-de-conflito.md) | Sincronização: outbox, push/pull e regras de conflito | Dados | Aceita |
| [ADR-0009](0009-ids-uuidv7-gerados-no-cliente.md) | IDs UUIDv7 gerados no cliente | Dados | Aceita |
| [ADR-0010](0010-banco-local-sqlite-atras-de-repositorios-com-drizzle.md) | Banco local SQLite atrás de repositórios, com Drizzle | Frontend | Aceita (spike OK no Chromium; Safari/Firefox pendentes) |
| [ADR-0011](0011-contrato-de-api-primeiro-openapi-com-geracao-de-codigo.md) | Contrato de API primeiro (OpenAPI) com geração de código | Integração | Aceita |
| [ADR-0012](0012-autenticacao-e-mail-google-e-apple-com-tokens-curtos.md) | Autenticação: e-mail, Google e Apple com tokens curtos | Segurança | Aceita |
| [ADR-0013](0013-ia-via-backend-com-a-api-do-claude-e-um-modulo-unico.md) | IA via backend com a API do Claude e um módulo único | IA | Aceita |
| [ADR-0014](0014-nota-pela-ia-para-respostas-digitadas.md) | Nota pela IA para respostas digitadas | IA | Aceita |
| [ADR-0015](0015-fila-de-tarefas-com-river-postgres.md) | Fila de tarefas com River (Postgres) | Backend | Aceita |
| [ADR-0016](0016-midias-em-armazenamento-de-objetos-com-url-assinada.md) | Mídias em armazenamento de objetos com URL assinada | Dados | Aceita |
| [ADR-0017](0017-conteudo-rico-dos-cards-em-json-de-blocos-tiptap.md) | Conteúdo rico dos cards em JSON de blocos (TipTap) | Frontend | Aceita |
| [ADR-0018](0018-ingestao-de-materiais-e-geracao-de-cards-com-trecho-de-orige.md) | Ingestão de materiais e geração de cards com trecho de origem | IA | Proposta — validar no spike da semana 3 |
| [ADR-0019](0019-estado-no-app-banco-reativo-zustand-e-tanstack-query.md) | Estado no app: banco reativo, Zustand e TanStack Query | Frontend | Aceita |
| [ADR-0020](0020-design-system-proprio-com-nativewind.md) | Design system próprio (theme.ts + useTheme; NativeWind removido) | Frontend | Aceita |
| [ADR-0021](0021-estrategia-de-testes.md) | Estratégia de testes | Qualidade | Aceita |
| [ADR-0022](0022-notificacoes-locais-no-maximo-uma-por-dia.md) | Notificações locais, no máximo uma por dia | Frontend | Aceita |
| [ADR-0023](0023-observabilidade-e-monitoramento-de-erros.md) | Observabilidade e monitoramento de erros | Operação | Aceita |
| [ADR-0024](0024-hospedagem-ci-cd-e-ambientes.md) | Hospedagem, CI/CD e ambientes | Operação | Proposta |
| [ADR-0025](0025-seguranca-e-privacidade.md) | Segurança e privacidade | Segurança | Aceita |
| [ADR-0026](0026-feature-flags-simples.md) | Feature flags simples | Operação | Aceita |
| [ADR-0027](0027-dia-do-usuario-fuso-horario-e-habito.md) | Dia do usuário, fuso horário e hábito | Domínio | Aceita |
| [ADR-0028](0028-quizzes-geracao-no-servidor-e-efeito-no-agendamento.md) | Quizzes: geração no servidor e efeito no agendamento | Domínio | Aceita |
| [ADR-0029](0029-internacionalizacao-e-acessibilidade-desde-a-v1.md) | Internacionalização e acessibilidade desde a v1 | Frontend | Aceita |
| [ADR-0030](0030-versionamento-releases-e-compatibilidade.md) | Versionamento, releases e compatibilidade | Operação | Aceita |
| [ADR-0031](0031-sem-aprendizado-em-passos-e-repeticao-na-sessao.md) | Sem aprendizado em passos e repetição na sessão | Domínio | Aceita |
| [ADR-0032](0032-denormalizacao-do-cache-retencao-no-revlog-e-otimizacao.md) | Cache denormalizado de card_states, retenção no revlog e otimização | Domínio | Aceita |
