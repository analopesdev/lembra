import { Check } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";

import { Icon, Num, Text } from "@/shared/ui";
import { fonts } from "@/shared/ui/theme";
import { useTheme } from "@/shared/ui/useTheme";

const LABELS = [
  { x: 14, key: "today" },
  { x: 72, key: "day1" },
  { x: 154, key: "day4" },
  { x: 256, key: "day12" },
] as const;

export function MemoryCurveArt() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const small = { fill: t.introMuted, fontFamily: fonts.numbers.semibold, fontSize: 12 };
  return (
    <Svg width={342} height={264} viewBox="0 0 342 264" role="img" aria-label={tr("intro.s1.art")}>
      <Line x1={8} y1={44} x2={336} y2={44} strokeWidth={1.5} strokeDasharray="4 6" stroke={t.introMuted} />
      <SvgText x={336} y={36} textAnchor="end" {...small}>
        90%
      </SvgText>
      <Line x1={8} y1={228} x2={336} y2={228} strokeWidth={1.5} stroke={t.introDeco} />
      <Path
        d="M14 24 C34 80 52 118 72 132 L72 24 C102 66 128 92 154 104 L154 24 C196 50 226 66 256 74 L256 24 C286 36 312 44 334 48"
        fill="none"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={t.onHero}
      />
      {[14, 72, 154, 256].map((x) => (
        <Circle key={x} cx={x} cy={24} r={7} fill={t.accent} />
      ))}
      {LABELS.map((l) => (
        <SvgText key={l.key} x={l.x} y={252} textAnchor="middle" {...small}>
          {tr(`intro.s1.${l.key}`)}
        </SvgText>
      ))}
    </Svg>
  );
}

const DOC_BARS = [70, 92, 84, 60, 88, 76, 50];
const DOC_HIGHLIGHT = new Set([92, 88]);
const CARD_BARS = [72, 56, 80];

export function MaterialToCardsArt() {
  const t = useTheme();
  return (
    <View style={styles.cardsRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.doc, { borderColor: t.introDeco }]}>
        {DOC_BARS.map((w, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { width: `${w}%`, backgroundColor: DOC_HIGHLIGHT.has(w) ? t.accent : t.introDeco },
            ]}
          />
        ))}
      </View>
      <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" aria-hidden>
        <Path
          d="M5 12h14M13 6l6 6-6 6"
          stroke={t.accent}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <View style={styles.cards}>
        {CARD_BARS.map((w, i) => (
          <View key={i} style={[styles.miniCard, { backgroundColor: t.introDeco }]}>
            <View style={[styles.dot, { backgroundColor: t.accent }]} />
            <View style={[styles.bar, { width: `${w}%`, backgroundColor: t.introMuted }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const WEEK = ["S", "T", "Q", "Q", "S", "S", "D"];

export function MinutesArt() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const r = 96;
  const c = 2 * Math.PI * r;
  return (
    <View style={styles.minutes}>
      <View style={styles.ring}>
        <Svg width={220} height={220} viewBox="0 0 220 220" aria-hidden>
          <Circle cx={110} cy={110} r={r} fill="none" strokeWidth={14} stroke={t.introDeco} />
          <Circle
            cx={110}
            cy={110}
            r={r}
            fill="none"
            strokeWidth={14}
            strokeLinecap="round"
            stroke={t.accent}
            strokeDasharray={`${c * 0.7} ${c}`}
            strokeDashoffset={c / 4}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Num size={64} tone="onHero">
            10
          </Num>
          <Text variant="subtitulo" style={{ color: t.introMuted }}>
            {tr("intro.s3.minPerDay")}
          </Text>
        </View>
      </View>
      <View accessible accessibilityRole="image" accessibilityLabel={tr("intro.s3.week")} style={styles.week}>
        {WEEK.map((d, i) => (
          <View key={i} style={styles.weekDay}>
            <View
              style={[
                styles.weekBox,
                i < 5 ? { backgroundColor: t.accent } : { borderWidth: 2, borderColor: t.introDeco },
              ]}
            >
              {i < 5 ? <Icon icon={Check} size={16} strokeWidth={3} color="onButton" /> : null}
            </View>
            <Text variant="legenda" style={{ color: t.introMuted, fontWeight: "600" }}>
              {d}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardsRow: { flexDirection: "row", alignItems: "center", gap: 14, width: 342 },
  doc: {
    width: 136,
    height: 184,
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 10,
  },
  bar: { height: 8, borderRadius: 99 },
  cards: { flex: 1, gap: 10 },
  miniCard: {
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 99 },
  minutes: { alignItems: "center", gap: 30, width: 342 },
  ring: { width: 220, height: 220 },
  ringCenter: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  week: { flexDirection: "row", width: "100%" },
  weekDay: { flex: 1, alignItems: "center", gap: 8 },
  weekBox: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
