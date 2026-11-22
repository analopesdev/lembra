# ADR-0030: Versionamento, releases e compatibilidade

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Operação

## Contexto

Versões antigas do app continuam instaladas por semanas; o backend precisa aceitá-las.

## Decisão

- SemVer para o app; o app envia sua versão em cada requisição.
- Backend aceita as duas últimas versões menores do app; abaixo disso responde `426` pedindo atualização.
- Migrações de banco sempre compatíveis com a versão anterior (expandir → migrar → contrair).
- Correções só de JS via EAS Update; mudanças nativas via novo build nas lojas.
- Changelog gerado a partir de commits convencionais.

## Consequências

**Positivas**

- Atualizações sem quebrar quem não atualizou.

**Negativas / riscos**

- Manter compatibilidade por um tempo exige cuidado em mudanças de API.

## Relacionados

ADR-0011, ADR-0024
