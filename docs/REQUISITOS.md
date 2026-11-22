# Lembra — Documento de requisitos

> Versão 1.1 · 22/11/2026 · Fonte de verdade dos requisitos (RF), requisitos não funcionais (RNF) e regras de negócio (RN).
> Decisões técnicas: `docs/adr/`. Arquitetura: `backend/BACKEND.md` e `apps/mobile/FRONTEND.md`.
> Em caso de conflito: **este documento define O QUÊ; as ADRs definem COMO.**

## Histórico

| Versão | Data | Mudança |
|---|---|---|
| 1.0 | 22/11/2026 | Versão inicial (app web local-first) |
| 1.1 | 22/11/2026 | Stack Expo (web, Android, iOS) + backend Go; login e sincronização entre aparelhos entram na v1 (RF-67 a RF-71); chave da IA passa para o servidor (RNF-06); novas regras RN-12 e RN-13 |

---

## 1. Visão e objetivos

O Lembra é um app de repetição espaçada que garante que o usuário lembra do que estudou, no tempo que tem, sem nunca acumular revisões. Combina o algoritmo do Anki (FSRS), a geração de cards por IA do Kuliko e a mecânica de hábito do Duolingo, corrigindo as principais reclamações de cada um.

**Problemas que resolve:**

- Anki: difícil de configurar, botão "Difícil" mal usado e pilhas de revisões que levam ao abandono.
- Apps de IA (Kuliko, StudyFetch, Knowt, Gizmo): muitos cards fracos, erros fora do material, paywall e cobranças surpresa.
- Duolingo: sequência e XP que premiam o atalho fácil, e não o aprendizado.

**Usuário:** uma pessoa estudando por conta própria com material próprio (PDFs, slides, notas, fotos, áudios), com ou sem data de prova, usando web, Android e iOS.

**Metas (após 30 dias de uso):**

| Meta | Alvo |
|---|---|
| Retenção real nas revisões | 85–90% |
| Tempo de estudo por dia | ≤ 15 min |
| Dias com estudo válido | ≥ 25 de 30 |
| Revisões atrasadas visíveis | 0 (dívida sempre distribuída) |
| Cards gerados aprovados sem edição | ≥ 70% |

---

## 2. Escopo

| Fase | Entra | Prazo estimado |
|---|---|---|
| v1 (MVP) | App web, Android e iOS; login e sincronização entre aparelhos; cards com texto formatado, imagens e áudio; revisão FSRS com orçamento de tempo; nota por resposta digitada com IA; geração de cards a partir de texto/PDF com rascunho e filtro; quizzes de prática (múltipla escolha, verdadeiro ou falso, resposta curta); coleções com data de prova; sequência honesta e folgas; memória retida; backup e exportação | Semanas 1–6 |
| v2 | Importação de decks .apkg do Anki; coach de cards problemáticos; notificação inteligente; modo de 3 minutos; resposta por voz; vídeo nos cards; oclusão de imagem; geração a partir de foto e áudio; simulados cronometrados | Semanas 7–10 |
| v3 | Grafo de conceitos com pré-requisitos; mapa mental colorido pela força da memória; variações automáticas de cards maduros | Depois |

**Fora de escopo:** ligas, ranking e XP; compartilhamento público de decks; chat livre com a IA fora do material; assinatura, planos e anúncios; colaboração entre usuários.

**Prioridade:** **Alta** = sem ela a v1 não funciona · **Média** = importante, pode atrasar · **Baixa** = desejável.

---

## 3. Requisitos funcionais

São 71 requisitos em 12 módulos.

### 3.1 Primeiro uso e configuração

| ID | Requisito | Prioridade | Fase |
|---|---|---|---|
| RF-01 | Configuração inicial em no máximo 3 telas: tempo diário (5/10/15/20 min), dias de folga e meta escrita ("para que estou estudando") | Alta | v1 |
| RF-02 | Tutorial interativo de até 1 minuto explicando a revisão e a nota, repetível a qualquer momento | Alta | v1 |
| RF-03 | Primeira semana guiada: no máximo 5 cards novos por dia e uma vitória visível no dia 1 (primeiro deck gerado do material do usuário) | Média | v1 |
| RF-04 | Botão de confirmação da meta com o texto "Comprometo-me" | Baixa | v1 |
| RF-05 | Nenhuma configuração de algoritmo visível por padrão; ajustes avançados em uma tela separada | Alta | v1 |

### 3.2 Tela Hoje

| ID | Requisito | Prioridade | Fase |
|---|---|---|---|
| RF-06 | Botões para iniciar sessão de 5, 10 ou 20 minutos, sendo o tempo configurado o padrão | Alta | v1 |
| RF-07 | Mostrar sequência de dias válidos, folgas restantes na semana e memória retida | Alta | v1 |
| RF-08 | Nunca mostrar a contagem total de revisões atrasadas; mostrar apenas "em dia" ou "em dia em N dias" | Alta | v1 |
| RF-09 | Mostrar a próxima prova e quantos dias faltam | Média | v1 |

### 3.3 Sessão de revisão

| ID | Requisito | Prioridade | Fase |
|---|---|---|---|
| RF-10 | Exibir a frente do card e um campo para digitar a resposta antes de revelar o verso | Alta | v1 |
| RF-11 | Avaliar a resposta por IA e mostrar a nota (De novo / Difícil / Bom / Fácil) com uma frase de justificativa | Alta | v1 |
| RF-12 | Revelar o verso com o trecho exato da fonte da qual o card foi gerado | Alta | v1 |
| RF-13 | Permitir corrigir a nota da IA com um toque; a correção substitui a nota no agendador | Alta | v1 |
| RF-14 | Registrar o tempo até a resposta e usá-lo na nota | Média | v1 |
| RF-15 | Modo clássico (virar o card e escolher a nota) para cards curtos, com aviso visual de que só "De novo" significa erro | Média | v1 |
| RF-16 | Encerrar a sessão quando o tempo escolhido acabar, terminando o card em andamento | Alta | v1 |
| RF-17 | Resumo ao fim da sessão: cards revisados, acertos e variação da memória retida | Média | v1 |
| RF-18 | Resposta por voz transcrita no lugar da digitada | Baixa | v2 |
| RF-19 | Modo de 3 minutos só com os cards de maior risco | Média | v2 |

### 3.4 Criação de cards

| ID | Requisito | Prioridade | Fase |
|---|---|---|---|
| RF-20 | Criar, editar, suspender e excluir cards manualmente (frente, verso, tags, importância 1–3) | Alta | v1 |
| RF-21 | Gerar cards por IA a partir de texto colado ou PDF enviado | Alta | v1 |
| RF-22 | Limitar a geração a 10 cards por vez, priorizando os conceitos mais importantes do material | Alta | v1 |
| RF-23 | Todo card gerado entra como rascunho; só entra no agendador depois de aprovado | Alta | v1 |
| RF-24 | Filtro de qualidade marca cada rascunho com avisos (RN-07) | Alta | v1 |
| RF-25 | Cada card guarda a referência ao documento e ao trecho de origem | Alta | v1 |
| RF-26 | Aprovar, editar ou descartar rascunhos um a um ou em lote | Média | v1 |
| RF-27 | *(Substituído pelo módulo 3.11 Conteúdo dos cards)* | — | — |

### 3.5 Agendamento

| ID | Requisito | Prioridade | Fase |
|---|---|---|---|
| RF-28 | Agendar com FSRS, com retenção alvo padrão de 90% | Alta | v1 |
| RF-29 | Ordenar as revisões pelo valor da revisão (RN-01) e encher a sessão até o tempo escolhido | Alta | v1 |
| RF-30 | Distribuir revisões atrasadas pelos próximos dias sem estourar o tempo diário (RN-02) | Alta | v1 |
| RF-31 | Pausar a entrada de cards novos enquanto houver dívida de revisões | Alta | v1 |
| RF-32 | Otimizar os parâmetros do FSRS automaticamente a cada 500 revisões ou 30 dias, sem ação do usuário | Média | v1 |
| RF-33 | Respeitar dias de folga planejados, redistribuindo as revisões para os dias vizinhos | Média | v1 |

### 3.6 Coleções e modo prova

| ID | Requisito | Prioridade | Fase |
|---|---|---|---|
| RF-34 | Organizar cards em coleções, cada uma com data de prova opcional | Alta | v1 |
| RF-35 | Ajustar a retenção alvo da coleção conforme a prova se aproxima e voltar ao padrão após a data (RN-05) | Alta | v1 |
| RF-36 | Mostrar a prontidão para a prova: percentual de cards importantes acima da retenção alvo | Média | v1 |

### 3.7 Hábito

| ID | Requisito | Prioridade | Fase |
|---|---|---|---|
| RF-37 | Contar o dia na sequência só quando ele for válido (RN-04, RN-13) | Alta | v1 |
| RF-38 | Dar 2 congelamentos grátis por semana, usados automaticamente | Alta | v1 |
| RF-39 | Enviar no máximo 1 notificação por dia, no horário habitual de estudo, só quando houver revisões de alto valor e com informação concreta | Média | v2 |

### 3.8 Progresso

| ID | Requisito | Prioridade | Fase |
|---|---|---|---|
| RF-40 | Gráfico da memória retida ao longo do tempo | Alta | v1 |
| RF-41 | Gráfico de minutos por dia e retenção real versus retenção alvo | Média | v1 |
| RF-42 | Comparativo desta semana com a anterior | Baixa | v1 |
| RF-43 | Lista de cards problemáticos (errados 4 vezes ou mais) com sugestão da IA para dividir, reescrever ou criar um mnemônico | Média | v2 |

### 3.9 Dados

| ID | Requisito | Prioridade | Fase |
|---|---|---|---|
| RF-44 | Backup automático local diário, mantendo os 7 últimos | Alta | v1 |
| RF-45 | Exportar e importar toda a base (JSON + mídias num arquivo .zip) e cards em CSV | Alta | v1 |
| RF-46 | Importar decks .apkg do Anki, incluindo o histórico de revisões | Média | v2 |

### 3.10 Quizzes

| ID | Requisito | Prioridade | Fase |
|---|---|---|---|
| RF-56 | Área Quizzes separada da revisão diária, acessível pela navegação principal | Alta | v1 |
| RF-57 | Gerar quiz por IA a partir de uma coleção, uma fonte ou um conjunto de tags, escolhendo de 5 a 50 questões | Alta | v1 |
| RF-58 | Tipos de questão: múltipla escolha, verdadeiro ou falso e resposta curta | Alta | v1 |
| RF-59 | Modo prática: explicação e trecho da fonte logo após cada resposta | Alta | v1 |
| RF-60 | Toda questão gerada passa pelo filtro de qualidade e pode ser marcada como "gabarito errado", saindo do quiz até ser corrigida | Alta | v1 |
| RF-61 | Transformar questões erradas em cards, ou reforçar o card de origem, com um toque | Alta | v1 |
| RF-62 | Criar questões manualmente e montar quizzes próprios | Média | v1 |
| RF-63 | Histórico de tentativas com nota, tempo e evolução por coleção | Média | v1 |
| RF-64 | Modo simulado: cronômetro, correção só no fim e nota final, imitando a prova | Média | v2 |
| RF-65 | Questões de associar colunas e de ordenar etapas | Média | v2 |
| RF-66 | Questões com imagem, áudio ou vídeo no enunciado | Média | v2 |

### 3.11 Conteúdo dos cards

| ID | Requisito | Prioridade | Fase |
|---|---|---|---|
| RF-47 | Editor de card em blocos: texto formatado (negrito, itálico, listas, cores, destaque), fórmulas LaTeX e código com destaque de sintaxe | Alta | v1 |
| RF-48 | Imagens: colar, arrastar ou tirar foto pelo celular; redimensionar; ampliar ao tocar | Alta | v1 |
| RF-49 | Áudio: gravar pelo microfone ou enviar arquivo; tocar automaticamente (opcional); velocidade de 0,75× a 1,5× | Alta | v1 |
| RF-50 | Frente e verso aceitam mídias diferentes (ex.: frente com áudio, verso com texto e imagem) | Alta | v1 |
| RF-51 | Tipos de card: básico, invertido (gera os dois sentidos), lacuna e digitar a resposta | Alta | v1 |
| RF-52 | Vídeo: enviar arquivo curto (até 2 min) ou link do YouTube com início e fim definidos | Média | v2 |
| RF-53 | Oclusão de imagem: esconder regiões de uma imagem, e cada região vira um card | Média | v2 |
| RF-54 | Gerar cards por IA também a partir de foto (anotação, slide, quadro) e de áudio (transcrição) | Média | v2 |
| RF-55 | A nota da IA considera a mídia do gabarito, usando a descrição da imagem ou a transcrição do áudio | Média | v2 |

### 3.12 Conta e sincronização

| ID | Requisito | Prioridade | Fase |
|---|---|---|---|
| RF-67 | Entrar com e-mail (código de uso único, sem senha), Google ou Apple | Alta | v1 |
| RF-68 | Sincronizar automaticamente todos os dados entre web, Android e iOS, sem ação do usuário (ao abrir, ao voltar do segundo plano, após cada sessão e a cada 5 min com rede) | Alta | v1 |
| RF-69 | Usar o app normalmente sem internet; as mudanças sincronizam quando a conexão voltar, sem perda de revisões | Alta | v1 |
| RF-70 | Mostrar o estado da sincronização de forma discreta (sincronizado, pendente, erro) | Média | v1 |
| RF-71 | Excluir a conta pelo app, apagando dados e mídias do servidor | Alta | v1 |

---

## 4. Requisitos não funcionais

| ID | Categoria | Requisito |
|---|---|---|
| RNF-01 | Offline | Revisão no modo clássico, criação manual, quizzes já gerados e agendamento funcionam sem internet. Respostas digitadas offline entram numa fila e são avaliadas quando a conexão voltar, ou o usuário dá a nota na hora |
| RNF-02 | Plataformas | App nativo Android e iOS (lojas) e app web, a partir de uma base de código única; layout para telas a partir de 360 px |
| RNF-03 | Desempenho | Abrir a tela Hoje em menos de 1 s com 10 mil cards; trocar de card em menos de 100 ms |
| RNF-04 | Latência da IA | Nota da resposta em menos de 2 s em 95% dos casos; geração de 10 cards em menos de 30 s |
| RNF-05 | Custo da IA | No máximo US$ 5/mês com 200 revisões avaliadas e 100 cards gerados por dia; respostas exatas (números, datas, termos) avaliadas por comparação, sem IA |
| RNF-06 | Privacidade | A chave da IA fica só no servidor; para a IA vai só o card, a resposta e o trecho da fonte, nunca a base inteira; dados em trânsito sempre por HTTPS |
| RNF-07 | Confiabilidade | Nenhuma perda de dados em atualização do app ou sincronização; backup antes de cada migração; o servidor aceita as duas últimas versões menores do app |
| RNF-08 | Fidelidade da IA | A IA avalia e gera somente com base no material; quando o trecho não sustentar a resposta, ela diz "não encontrei na fonte" |
| RNF-09 | Acessibilidade | Contraste AA, navegação por teclado na web, rótulos de acessibilidade, fonte ajustável e modo escuro |
| RNF-10 | Idioma | Interface em português (pt-BR); cards em qualquer idioma |
| RNF-11 | Simplicidade | Nenhuma tela principal com mais de 3 ações primárias; uma nova função só entra se não aumentar a configuração inicial |
| RNF-12 | Armazenamento de mídia | Mídias guardadas no aparelho e disponíveis offline, com cópia no servidor. Limite de 20 MB por imagem ou áudio e 100 MB por vídeo; compressão ao salvar (imagem WebP até 1600 px, áudio compacto mono); aviso ao passar de 80% da cota local |
| RNF-13 | Formatos aceitos | Imagem: PNG, JPG, WebP, GIF, HEIC. Áudio: MP3, M4A, OGG, WAV. Vídeo: MP4, WebM ou link do YouTube (exige internet). Documento: PDF |
| RNF-14 | Conformidade com lojas | Sign in with Apple quando houver login social; exclusão de conta no app; política de privacidade publicada |
| RNF-15 | Sincronização | Mudanças feitas num aparelho aparecem nos outros em até 1 minuto com ambos online |

---

## 5. Regras de negócio e algoritmos

Os valores são pontos de partida, ajustáveis depois de 30 dias de dados reais. Toda RN deve ser implementada como função pura no domínio e ter testes de tabela.

### RN-01 — Valor da revisão (ordem da sessão)

```
V = (1 − R) × I × P
```

- **R** = chance de lembrar agora (calculada pelo FSRS).
- **I** = peso da importância: 1 → 1,0 · 2 → 1,5 · 3 → 2,0.
- **P** = peso da prova = 1 + (30 − d) / 30 quando faltam d ≤ 30 dias; nos outros casos, 1.
- A sessão pega os cards em ordem decrescente de V até o tempo acabar, usando o tempo médio por card do histórico (15 s no início). Empates são resolvidos por ID (ordem estável).

### RN-02 — Dívida de revisões

- Cards atrasados formam a dívida. Cada sessão reserva no máximo 30% do tempo para ela, sempre os de maior V primeiro.
- Previsão mostrada: dias até zerar = dívida ÷ (30% da capacidade diária em cards).
- Enquanto houver dívida, nenhum card novo entra.

### RN-03 — Nota pela IA

| Resultado da avaliação | Nota FSRS |
|---|---|
| Errada, vazia ou "não sei" | De novo |
| Correta, mas incompleta ou com mais de 20 s para responder | Difícil |
| Correta e completa | Bom |
| Correta, completa, em menos de 5 s e card já estável (intervalo > 21 dias) | Fácil |

A IA recebe pergunta, gabarito, trecho da fonte e resposta, e devolve JSON com o resultado e uma justificativa de até 15 palavras. O mapeamento resultado → nota é feito no domínio, não pela IA. A correção manual sempre vence e é registrada como evento.

### RN-04 — Dia válido na sequência

O dia conta se o usuário fizer pelo menos 80% das revisões de alto valor do dia, ou pelo menos 3 minutos de recordação ativa com no mínimo 10 cards respondidos. Dia de folga planejado não quebra a sequência. Dia sem estudo usa um congelamento automático, até 2 por semana (segunda a domingo).

### RN-05 — Modo prova

| Dias até a prova | Retenção alvo da coleção |
|---|---|
| Mais de 30 | 85% |
| 8 a 30 | 90% |
| 7 ou menos | 95% (cards de importância 3 primeiro) |
| Depois da prova | Volta para 90% |

### RN-06 — Memória retida

Número de cards ativos com R ≥ 90% no momento, recalculado a cada abertura do app, após cada sync e ao fim de cada sessão. Cards suspensos, excluídos ou em rascunho não contam.

### RN-07 — Filtro de qualidade dos cards gerados

Um rascunho recebe aviso quando: a pergunta tem mais de um alvo; o verso passa de 20 palavras; uma lacuna pode ser deduzida pela gramática; falta uma condição presente no trecho de origem; ou a pergunta só testa reconhecimento ("Defina X" sem contexto). Rascunhos com 2 ou mais avisos vêm desmarcados por padrão.

### RN-08 — Card problemático (v2)

Um card errado 4 vezes ou mais é marcado e sai da fila até o usuário aceitar ou recusar a sugestão da IA (dividir, reescrever ou criar um mnemônico).

### RN-09 — Quizzes e agendamento

Quizzes complementam a revisão, não a substituem. Uma questão ligada a um card afeta o FSRS assim:

| Resultado no quiz | Efeito no card de origem |
|---|---|
| Erro em qualquer tipo de questão | Registra "De novo" |
| Acerto em múltipla escolha ou verdadeiro/falso, card vencido ou a até 2 dias do vencimento | Registra "Difícil" |
| Acerto em resposta curta, card vencido ou a até 2 dias do vencimento | Nota pela RN-03 |
| Acerto com card longe do vencimento | Não altera o agendamento, só o histórico |

### RN-10 — Alternativas das questões

As alternativas erradas vêm de outros cards ou conceitos da mesma coleção, têm forma e tamanho parecidos com os da correta e nunca são "todas as anteriores" ou "nenhuma das anteriores". A posição da correta é sorteada.

### RN-11 — Cards com mídia

No card invertido, o sentido que pede para reconhecer uma mídia (ex.: ouvir o áudio e escrever a palavra) é agendado como um card separado. Na oclusão de imagem, cada região é um card com estado FSRS próprio, e a imagem é guardada uma vez só.

### RN-12 — Estado FSRS derivado do histórico

O histórico de revisões é append-only (nunca alterado ou apagado). O estado de cada card (estabilidade, dificuldade, vencimento) é uma função pura do histórico ordenado e dos parâmetros FSRS, e o valor guardado é apenas cache. Correção de nota gera um novo evento. Cliente (TypeScript) e servidor (Go) devem produzir o mesmo estado para o mesmo histórico (vetores em `contracts/fsrs-vectors/`).

### RN-13 — Dia de estudo e fuso horário

Datas são guardadas em UTC. O "dia de estudo" é calculado no fuso do usuário com virada às 4h da manhã (estudar à 1h conta para o dia anterior). O fuso é atualizado quando o aparelho muda. O servidor é a fonte da verdade da sequência, recalculada a partir das sessões sincronizadas.

---

## 6. Modelo de dados (nível de produto)

Entidades e campos essenciais. Detalhes de tabelas, índices e sincronização: ADR-0005, ADR-0007, ADR-0008 e ADR-0009. Toda entidade de usuário tem `id` (UUIDv7), `user_id`, `created_at`, `updated_at` e `deleted_at`.

| Entidade | Campos principais |
|---|---|
| Usuario | id, email, provedor_login, fuso_horario, criado_em |
| Dispositivo | id, usuario_id, plataforma (web/android/ios), versao_app, ultimo_sync |
| Colecao | id, nome, data_prova?, retencao_alvo |
| Fonte | id, colecao_id, tipo (pdf/texto/foto/áudio), titulo, arquivo_media_id?, texto_extraido |
| Card | id, colecao_id, fonte_id?, trecho_fonte?, tipo (básico/invertido/lacuna/digitar/oclusão), frente e verso em conteúdo rico (JSON de blocos), tags[], importancia (1–3), modo (resposta/clássico), status (rascunho/ativo/suspenso/problemático), avisos_qualidade[] |
| EstadoFSRS (cache) | card_id, estabilidade, dificuldade, vencimento, ultima_revisao, repeticoes, lapsos, estado |
| Revisao (append-only) | id, card_id, data_hora, origem (sessão/quiz), resposta_digitada?, resultado_ia?, nota_ia?, nota_final, justificativa_ia?, tempo_ms, versao_prompt? |
| CorrecaoNota (append-only) | id, revisao_id, nota_nova, data_hora |
| Sessao | id, inicio, fim, minutos_planejados, cards_revisados, acertos, memoria_antes, memoria_depois |
| Dia | data (dia de estudo), valido, congelamento_usado, folga_planejada |
| Midia | id, dono (card_id/questao_id/fonte_id), tipo (imagem/áudio/vídeo/pdf), caminho_local?, chave_storage?, url_externa?, mime, tamanho, duracao?, inicio_fim?, descricao_ou_transcricao?, regioes_oclusao? |
| Quiz | id, colecao_id, titulo, origem (IA/manual), modo (prática/simulado), tempo_limite? |
| Questao | id, quiz_id, card_id?, fonte_id?, trecho_fonte?, tipo, enunciado (conteúdo rico), alternativas[], gabarito, explicacao, avisos_qualidade[], marcada_errada |
| TentativaQuiz (append-only) | id, quiz_id, inicio, fim, respostas[] (questao_id, resposta, correta, tempo_ms), nota |
| Configuracao | minutos_diarios, dias_folga[], meta_texto, retencao_padrao, parametros_fsrs, horario_habitual |

---

## 7. Arquitetura (resumo)

Detalhes obrigatórios nas ADRs e nos documentos de arquitetura.

| Parte | Decisão | Referência |
|---|---|---|
| Modelo | Local-first: a interface lê e escreve no banco local; o servidor sincroniza, autentica, chama a IA e guarda mídias | ADR-0002 |
| App | Expo (React Native + TypeScript) para web, Android e iOS | ADR-0003, FRONTEND.md |
| Banco local | SQLite (expo-sqlite / wa-sqlite) com Drizzle, atrás de repositórios | ADR-0010 |
| Backend | Go, monólito modular com arquitetura hexagonal | ADR-0004, BACKEND.md |
| Banco do servidor | PostgreSQL com pgx, sqlc e goose | ADR-0005 |
| Algoritmo | FSRS (ts-fsrs e go-fsrs) com vetores de conformidade | ADR-0006, RN-12 |
| Sincronização | Outbox + push/pull; append-only para revisões; última edição vence para o resto | ADR-0008 |
| IA | API do Claude só pelo backend, módulo `ai` único, prompts versionados | ADR-0013, ADR-0014, ADR-0018 |
| Tarefas pesadas | Fila River sobre Postgres | ADR-0015 |
| Mídias | Cloudflare R2 com URL assinada; compressão no aparelho | ADR-0016 |
| Contrato | OpenAPI em `contracts/openapi.yaml` com geração de código | ADR-0011 |

---

## 8. Critérios de aceite da v1

A v1 está pronta quando todos os itens passam (cada um vira um teste E2E). Ela está dando certo quando as metas da seção 1 forem atingidas após 30 dias.

- [ ] Do zero até a primeira revisão em menos de 3 minutos, colando um texto e aprovando os cards gerados
- [ ] Uma sessão de 10 minutos termina entre 10 e 11 minutos e prioriza os cards de maior valor da revisão
- [ ] Depois de 5 dias sem abrir o app, a tela Hoje mostra "em dia em N dias" e não a contagem de atrasados, e a sessão seguinte respeita o tempo escolhido
- [ ] A nota da IA bate com a do usuário em pelo menos 85% de 100 respostas de teste
- [ ] Todo card gerado mostra o trecho de origem, e nenhum entra no agendador sem aprovação
- [ ] Em 10 rascunhos com defeitos conhecidos, o filtro de qualidade marca pelo menos 8
- [ ] Abrir o app e virar 2 cards fáceis não conta como dia válido; 3 minutos com 10 respostas conta
- [ ] Estudar à 1h da manhã conta para o dia anterior
- [ ] Uma coleção com prova em 7 dias passa a usar retenção alvo de 95%
- [ ] Revisão no modo clássico funciona em modo avião
- [ ] Um card com imagem na frente e áudio gravado no verso funciona em modo avião
- [ ] Um quiz de 10 questões gerado de uma coleção fica pronto em menos de 30 s, e cada questão mostra o trecho da fonte depois de respondida
- [ ] Marcar uma questão como "gabarito errado" tira ela do quiz na hora
- [ ] Errar uma questão ligada a um card registra "De novo" nesse card
- [ ] Um card criado na web aparece no celular em até 1 minuto
- [ ] Revisar o mesmo card offline em dois aparelhos e depois sincronizar mantém as duas revisões e o mesmo estado final nos dois
- [ ] Exportar, apagar os dados e importar devolve cards, quizzes, mídias e histórico idênticos
- [ ] Excluir a conta remove dados e mídias do servidor

**Métricas acompanhadas na tela Progresso:** retenção real versus alvo, minutos por dia, dias válidos por mês, memória retida, taxa de correção da nota da IA e taxa de aprovação de cards gerados.

---

## 9. Riscos e perguntas em aberto

| Risco | Mitigação |
|---|---|
| A IA dá nota errada e distorce o FSRS | Correção com um toque; comparação exata sem IA para respostas curtas; acompanhar a taxa de correção |
| Custo ou lentidão da IA | Modelo rápido para nota; cache por card e resposta idêntica; limite mensal configurável |
| Banco local na web instável | Spike na semana 1 (ADR-0010) com plano B em IndexedDB |
| Conflitos de sincronização | Revisões append-only e estado derivado (RN-12); testes de propriedade do merge |
| Digitar toda resposta cansa; mídias enchem a cota | Modo clássico; voz na v2; compressão, limites por arquivo e vídeos longos só por link |
| Escopo crescer antes da v1 provar valor | RNF-11 e v2 só depois das metas de 30 dias |

**Perguntas em aberto:**

- [ ] O que será estudado primeiro (idioma, concurso, faculdade, trabalho)? Isso muda o tipo de card e o critério da nota.
- [ ] Qual modelo de IA usar em cada tarefa e qual o teto de gasto mensal?
- [ ] Importar decks atuais do Anki já na v1?

---

## 10. Glossário rápido

| Termo | Significado |
|---|---|
| FSRS | Algoritmo de repetição espaçada que calcula, para cada card, a chance de lembrar e o melhor dia para revisar |
| R (retrievability) | Chance de lembrar o card agora, de 0% a 100% |
| Retenção alvo | Chance de lembrar que se quer manter (ex.: 90%) |
| Dívida | Revisões atrasadas, distribuídas pelos próximos dias |
| Memória retida | Quantidade de cards com R ≥ 90% agora |
| Dia válido | Dia que conta na sequência (RN-04) |
| Congelamento | Folga automática que protege a sequência (2 por semana) |
| Append-only | Registro que só recebe inserções, nunca alterações |
| Local-first | Dados no aparelho, sincronizados em segundo plano |