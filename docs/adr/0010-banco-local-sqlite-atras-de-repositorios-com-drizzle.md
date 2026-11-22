# ADR-0010: Banco local SQLite atrás de repositórios, com Drizzle

- **Status:** Proposta — validar no spike da semana 1
- **Data:** 2026-11-22
- **Área:** Frontend

## Contexto

O app precisa de um banco local relacional nas três plataformas. No mobile, `expo-sqlite` é maduro; na web, o suporte ainda é alpha.

## Decisão

- SQLite em todas as plataformas: `expo-sqlite` no mobile; `wa-sqlite` com OPFS na web.
- Drizzle ORM para schema, migrações e consultas tipadas.
- Todo acesso passa por **interfaces de repositório** (`CardsRepository`…); a UI nunca escreve SQL.
- Implementação em memória dos repositórios para testes.
- Uma suíte de testes de contrato roda contra todas as implementações.
- **Critério do spike:** CRUD + consulta reativa + 10 mil cards na web com tela Hoje < 1 s. Se falhar, plano B: IndexedDB (Dexie) na web atrás da mesma interface.

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
