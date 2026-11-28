# Lembra

App de flashcards com repetição espaçada (FSRS). Monorepo com:

- `apps/mobile`: app em Expo (React Native), roda no celular (Expo Go) e na web. Os dados ficam no aparelho, em SQLite.
- `backend`: API em Go (mídias via URL assinada; login e sincronização ainda não existem).
- `contracts`: contrato OpenAPI e vetores de teste compartilhados.

O app funciona sozinho, sem o backend. O backend só é necessário para enviar imagens e áudios ao armazenamento (MinIO).

## Pré-requisitos

| Ferramenta | Versão | Para quê |
| --- | --- | --- |
| Node.js | 22.13 ou mais nova (veja `.nvmrc`) | app |
| pnpm | 12.16.1 (`corepack enable` instala a versão certa) | app |
| Expo Go | última versão, no celular | rodar no celular |
| Go | 1.26 (o `go` baixa o toolchain sozinho se o seu for mais antigo) | backend |
| Docker com Compose | qualquer versão recente | Postgres e MinIO do backend |

Com o nvm:

```sh
nvm install
nvm use
corepack enable
```

## Rodar o app

Na raiz do projeto:

```sh
pnpm install
pnpm dev
```

O Expo mostra um QR code no terminal.

- **Celular:** abra o Expo Go e escaneie o QR code. O celular precisa estar na mesma rede Wi-Fi do computador.
- **Web:** aperte `w` no terminal do Expo, ou rode `pnpm web`.
- **Emulador:** `pnpm android` ou `pnpm ios` (precisa do Android Studio ou do Xcode).

### Depois de trocar de branch ou puxar código novo

Instale os pacotes de novo e limpe o cache do Metro. Sem isso o app pode continuar mostrando a versão antiga ou dar erro ao carregar:

```sh
pnpm install
pnpm dev --clear
```

Na web, recarregue com `Ctrl+Shift+R`. No celular, feche e abra o Expo Go.

### Versão web de produção

```sh
pnpm serve:web
```

Gera o build em `apps/mobile/dist` e serve em <http://localhost:4173>. Esse servidor envia os cabeçalhos COOP/COEP que o SQLite da web exige; um servidor estático comum não funciona.

## Rodar o backend (opcional)

Sobe o Postgres (porta 5433) e o MinIO (API na 9000, console na 9001), cria o bucket `lembra` e inicia a API em <http://localhost:8080>:

```sh
make dev
```

Para conferir: <http://localhost:8080/v1/health> deve responder `{"status":"ok"}`.

O console do MinIO fica em <http://localhost:9001> (usuário `lembra`, senha `lembra-secret`). Essas credenciais são só de desenvolvimento.

Para parar o Postgres e o MinIO:

```sh
make deps-down
```

### Configuração

A API lê variáveis `LEMBRA_*` do ambiente. Ela **não** lê o arquivo `.env` sozinha. Com `LEMBRA_ENV=local` (o padrão), todos os valores já apontam para o Docker Compose e não é preciso configurar nada. O `.env.example` lista as variáveis; para usá-las, exporte-as no shell antes do `make dev`:

```sh
set -a; source .env.example; set +a
make dev
```

### Celular falando com o backend

No Expo Go, o app usa o mesmo IP do computador que serve o Metro e procura a API na porta 8080 dele. Em ambiente local, a API devolve as URLs de envio do MinIO com esse mesmo IP. Por isso o envio de imagens e áudios funciona sem configurar nada, desde que o celular alcance as portas 8080 e 9000 do computador.

Se o envio não funcionar, confira se o firewall libera essas portas. Para apontar o app para outra API:

```sh
EXPO_PUBLIC_LEMBRA_API_URL=http://192.168.0.10:8080 pnpm dev --clear
```

Sem a API rodando, o card é salvo do mesmo jeito. A imagem fica só no aparelho. O app ainda não tenta enviar de novo sozinho; isso só acontece quando o card é salvo outra vez.

## Testes e verificações

| Comando | O que faz |
| --- | --- |
| `pnpm lint` | ESLint e tipos do app |
| `pnpm test` | testes do app (Jest) |
| `pnpm --filter mobile e2e:crud` | e2e no navegador (Playwright); precisa de `pnpm build:web` antes |
| `make test` | testes do backend e do app |
| `make lint` | lint do backend (golangci-lint) e do app |
| `make gen` | regenera os tipos da API a partir de `contracts/openapi.yaml` |

## Problemas comuns

**"banco na versão N, mas este app só conhece até M"**
O banco local foi criado por uma branch mais nova que a atual. Volte para a branch mais nova ou apague os dados locais do app:

- Web: ferramentas do navegador, Application, Storage, "Clear site data", e recarregue.
- Celular: Configurações, Apps, Expo Go, Armazenamento, Limpar dados (Android), ou reinstale o Expo Go.

Isso apaga os cards de teste.

**Tela vermelha com `fetchThenEvalJs` ou "Unable to resolve module"**
Faltam pacotes ou o cache está velho. Rode `pnpm install` e `pnpm dev --clear`.

**O celular não abre o app pelo QR code**
Confira se o celular e o computador estão na mesma rede. Se a rede bloquear, use `pnpm dev --tunnel`.
