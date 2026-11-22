# ADR-0018: Ingestão de materiais e geração de cards com trecho de origem

- **Status:** Proposta — validar no spike da semana 3
- **Data:** 2026-11-22
- **Área:** IA

## Contexto

Cards gerados precisam mostrar o trecho exato da fonte (RF-12, RF-25), passar por filtro de qualidade (RN-07) e ser no máximo 10 por vez (RF-22).

## Decisão

- Upload do PDF/texto/foto para o R2; job no worker processa.
- Envio do documento à API do Claude com o recurso de **citações**, para que cada card venha com o trecho literal e a página de origem. Se o recurso não atender, plano B: extrair texto por página no servidor, dividir em trechos com IDs e pedir que a IA referencie o ID do trecho.
- Filtro de qualidade em duas camadas: regras determinísticas no domínio (tamanho, mais de um alvo, lacuna adivinhável) + checagem pela IA (condição faltando, só reconhecimento).
- Resultado gravado como rascunhos (`status = draft`) com `avisos_qualidade`; só o usuário aprova.
- Deduplicação: não sugerir card muito parecido com um existente na coleção.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Gerar sem trecho de origem | Viola RNF-08 e impede conferir erros. |
| Extração de PDF no aparelho | Pesado no celular e duplicado em três plataformas. |

## Consequências

**Positivas**

- Cards verificáveis e de qualidade controlada.

**Negativas / riscos**

- Custo maior por geração (mitigado pelo limite de 10).

## Relacionados

ADR-0013, ADR-0015, RN-07, RF-21 a RF-26
