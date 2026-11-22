# ADR-0016: Mídias em armazenamento de objetos com URL assinada

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Dados

## Contexto

Cards e questões têm imagens, áudio e vídeo (RF-47 a RF-55). Arquivos não devem passar pela API nem ficar no Postgres, e precisam funcionar offline.

## Decisão

- Cloudflare R2 (compatível com S3); MinIO localmente.
- Compressão **no aparelho** antes de salvar: imagem WebP até 1600 px; áudio compacto mono; vídeo até 2 min (v2).
- Arquivo salvo primeiro no sistema de arquivos local; upload em segundo plano via URL assinada (PUT) emitida pela API.
- Postgres guarda só metadados (`media`); chave `users/{user_id}/media/{media_id}`.
- Download via URL assinada de curta duração; cache local.
- Limites: 20 MB por imagem/áudio, 100 MB por vídeo; vídeos longos só por link do YouTube.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Arquivos no Postgres | Banco cresce e fica caro e lento. |
| Upload via API | Consome banda e memória do servidor. |

## Consequências

**Positivas**

- Barato (R2 não cobra saída), escalável e offline.

**Negativas / riscos**

- Gerenciar uploads pendentes e arquivos órfãos (job de limpeza semanal).

## Relacionados

RNF-12, RNF-13, ADR-0017
