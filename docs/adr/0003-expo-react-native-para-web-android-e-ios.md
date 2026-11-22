# ADR-0003: Expo (React Native) para web, Android e iOS

- **Status:** Aceita
- **Data:** 2026-11-22
- **Área:** Frontend

## Contexto

O app precisa rodar na web, no Android e no iOS, com acesso a microfone, câmera, notificações e publicação nas lojas, mantido por uma pessoa.

## Decisão

- Expo (SDK estável atual) + React Native + TypeScript `strict`, com react-native-web para a web.
- Expo Router para navegação baseada em arquivos, igual nas três plataformas.
- EAS Build/Submit para as lojas e EAS Update para atualizações rápidas de JavaScript.
- Web publicada como export estático.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Flutter | Perde o ecossistema JS (ts-fsrs, TipTap, Drizzle); Dart só para este projeto. |
| Capacitor + PWA | Mais rápido para web, mas experiência menos nativa e plugins menos maduros para áudio/notificações. |
| Apps nativos separados | Três bases de código: inviável para uma pessoa. |

## Consequências

**Positivas**

- Uma base de código para tudo.
- Reaproveita ts-fsrs e bibliotecas JS.

**Negativas / riscos**

- Algumas APIs têm suporte parcial na web (notificações, SQLite): isoladas por adaptadores de plataforma (ADR-0010).
- Atualizar o SDK do Expo a cada ciclo exige teste E2E completo.

## Relacionados

ADR-0010, ADR-0019, ADR-0020
