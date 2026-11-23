# ADR-0020: Design system próprio com NativeWind

- **Status:** Aceita (atualizada em 2026-11-22: NativeWind removido)
- **Data:** 2026-11-22
- **Área:** Frontend

## Contexto

A interface precisa ser simples (RNF-11), acessível (RNF-09), com tema escuro, e igual nas três plataformas.

## Decisão

1. **`theme.ts` é a única fonte de verdade** dos tokens (cores claro/escuro, tipografia, cantos, espaços, `scrim`), vindo de `docs/lembra-design-kit` e copiado para `src/shared/ui/theme.ts`.
2. **Estilos com `useTheme()` e `StyleSheet`.** Não há classes utilitárias nem NativeWind/Tailwind: dois sistemas de estilo competem entre si, e a regra de lint contra hex solto (`no-restricted-syntax`) só garante consistência se houver um único caminho.
3. **Pacotes aprovados (itens do kit):** `expo-font`, `@expo-google-fonts/manrope` (texto) e `@expo-google-fonts/sora` (números de dados, `tabular-nums`), `lucide-react-native` e `react-native-svg` (ícones de traço, 24 px, `strokeWidth` 2 por padrão). Instalar sempre com `npx expo install` para casar com o SDK.
4. Componentes base em `shared/ui` (Button, Card, Tag, ProgressBar, Ring, BottomNav, Input, Sheet), sem lógica de domínio.
5. Tema claro/escuro desde a v1 (segue o sistema; opção manual nas Configurações), fonte ajustável, contraste AA nos tokens.
6. Verificação visual: cada tela pronta é capturada em 390×844 nos dois temas e comparada com o HTML de `referencia/`; diferenças só com motivo anotado.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| NativeWind (Tailwind) | Segundo sistema de estilo ao lado do `theme.ts`; enfraquece o lint contra hex solto. |
| Tamagui | Poderoso, mas mais complexo de configurar. |
| Biblioteca pronta (Paper, gluestack) | Visual genérico e difícil de personalizar. |

## Consequências

**Positivas**

- Rápido de estilizar e consistente.

**Negativas / riscos**

- Componentes base próprios para escrever.

## Relacionados

RNF-09, RNF-11
