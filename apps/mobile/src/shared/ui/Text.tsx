import { Text as RNText, type TextProps, type TextStyle } from "react-native";

import { fonts, type as scale } from "./theme";
import { useTheme, type Colors } from "./useTheme";

export type Variant = "display" | "pergunta" | "titulo" | "subtitulo" | "corpo" | "label" | "legenda";

const FAMILY: Record<number, string> = {
  400: fonts.text.regular,
  500: fonts.text.medium,
  600: fonts.text.semibold,
  700: fonts.text.bold,
  800: fonts.text.extrabold,
};

/** Estilo de texto de uma variante da escala do kit (tamanho, altura de linha e espaçamento em px). */
export function textStyle(variant: Variant): TextStyle {
  const v = scale[variant] as { size: number; lineHeight: number; weight: number; letterSpacing?: number };
  return {
    fontFamily: FAMILY[v.weight] ?? fonts.text.regular,
    fontSize: v.size,
    lineHeight: Math.round(v.size * v.lineHeight),
    letterSpacing: v.letterSpacing ? v.size * v.letterSpacing : 0,
  };
}

export type Tone = keyof Pick<
  Colors,
  | "text"
  | "textMuted"
  | "link"
  | "onButton"
  | "onPrimary"
  | "onTint"
  | "onHero"
  | "onHeroMuted"
  | "success"
  | "danger"
>;

type Props = TextProps & { variant?: Variant; tone?: Tone };

/** Texto do app: Manrope, cor sempre por token. */
export function Text({ variant = "corpo", tone = "text", style, ...rest }: Props) {
  const t = useTheme();
  return <RNText {...rest} style={[textStyle(variant), { color: t[tone] }, style]} />;
}

type NumProps = TextProps & { size?: number; tone?: Tone };

/** Número que mostra dado (contagem, tempo, %, sequência): Sora com algarismos tabulares. */
export function Num({ size = 32, tone = "text", style, ...rest }: NumProps) {
  const t = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: fonts.numbers.bold,
          fontSize: size,
          lineHeight: size,
          letterSpacing: size * -0.03,
          fontVariant: ["tabular-nums"],
          color: t[tone],
        },
        style,
      ]}
    />
  );
}
