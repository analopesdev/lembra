# ADR-0017: Conteúdo rico dos cards em JSON de blocos (TipTap)

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Frontend

## Contexto

Frente e verso aceitam texto formatado, fórmulas, código, imagem, áudio e vídeo. O formato precisa ser editável, renderizável nas três plataformas e legível pela IA.

## Decisão

- Formato de armazenamento: documento JSON do ProseMirror/TipTap, com nós próprios: `image`, `audio`, `video`, `math`, `code`, `cloze`.
- Mídias referenciadas por `mediaId`, nunca por URL.
- Editor: 10tap-editor (TipTap) no mobile e TipTap na web.
- Renderização de leitura com componentes nativos próprios (sem WebView) para desempenho na revisão.
- Conversão para texto simples (`toPlainText`) no domínio, usada pela IA, pela busca e pela comparação exata.
- Schema versionado; migração de documentos quando o schema mudar.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Markdown | Fraco para mídia e cloze; ambíguo para editar. |
| HTML | Difícil de validar e renderizar nativamente. |

## Consequências

**Positivas**

- Estrutura validável e extensível.

**Negativas / riscos**

- Renderizador nativo próprio para manter.

## Relacionados

RF-47 a RF-51, ADR-0016
