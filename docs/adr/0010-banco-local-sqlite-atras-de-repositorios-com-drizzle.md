# ADR-0010: Banco local SQLite atrás de repositórios, com Drizzle

- **Status:** Aceita (atualizada em 2026-11-22 após o spike; Safari e Firefox pendentes antes de fechar a web)
- **Data:** 2026-11-22
- **Área:** Frontend

## Contexto

O app precisa de um banco local relacional nas três plataformas. No mobile, `expo-sqlite` é maduro; na web, o suporte ainda é alpha.

## Decisão

- SQLite em todas as plataformas com **`expo-sqlite`**, inclusive na web (SDK 58: wa-sqlite + OPFS em worker, estável o bastante). Muda a decisão original (wa-sqlite direto na web): é a mesma engine, sem código próprio de worker.
- Drizzle roda sobre o driver **assíncrono** (`sqlite-proxy`), igual nas três plataformas, para nunca bloquear a UI.
- A web exige `SharedArrayBuffer`: cabeçalhos COOP/COEP (ver ADR-0024).
- `PRAGMA cache_size = -65536`: o padrão (2 MB) faz cada consulta reler páginas do OPFS.
- Drizzle ORM para schema, migrações e consultas tipadas.
- Todo acesso passa por **interfaces de repositório** (`CardsRepository`…); a UI nunca escreve SQL.
- Implementação em memória dos repositórios para testes.
- Uma suíte de testes de contrato roda contra todas as implementações.
- **Critério do spike (atendido, Chromium, 10 mil cards):** Hoje pronto em ~263 ms (385 ms desde a navegação); contrato 10/10. **Antes de fechar a web:** rodar contrato e benchmark também no Safari e no Firefox; nativo (Android intermediário) medido na Etapa 2.
- Padrões de desempenho decididos no spike: tela Hoje lê só colunas denormalizadas e indexadas (ADR-0032); listas longas paginadas; escrita em lote sempre em transação.
- **Critério original do spike:** CRUD + consulta reativa + 10 mil cards na web com tela Hoje < 1 s. Se falhar, plano B: IndexedDB (Dexie) na web atrás da mesma interface.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| WatermelonDB | Bom no mobile, web menos madura e modelo próprio. |
| Realm | Descontinuado para sync; acoplamento alto. |
| IndexedDB em todas | Pior no mobile e sem SQL. |

## Consequências

**Positivas**

- Troca de implementação sem tocar nas telas.
- Testes de features sem banco real.

**Negativas / riscos**

- Risco na web até o spike confirmar.

## Relacionados

ADR-0002, ADR-0003, FRONTEND.md
