// RN-13 / ADR-0027: "dia de estudo" no fuso do usuário, com virada às 4h da manhã.
// Pura: o instante e o fuso entram por parâmetro; Intl só formata, não lê o relógio, e o calendário
// é aritmética de inteiros (sem `Date`), então não há dependência do fuso da máquina.
export const DAY_ROLLOVER_HOUR = 4;

export type StudyDay = string; // "YYYY-MM-DD"

// Dias desde 1970-01-01 para uma data civil (algoritmo de Howard Hinnant).
function daysFromCivil(y: number, m: number, d: number): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function civilFromDays(z0: number): [number, number, number] {
  const z = z0 + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  );
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return [yoe + era * 400 + (m <= 2 ? 1 : 0), m, d];
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");
const toDays = (day: StudyDay): number => {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return daysFromCivil(y, m, d);
};

/** Dia de estudo de um instante: no relógio de parede do fuso, antes das 4h conta como o dia anterior. */
export function studyDayOf(at: Date, timeZone: string): StudyDay {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at.getTime());
  const num = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  let days = daysFromCivil(num("year"), num("month"), num("day"));
  if (num("hour") < DAY_ROLLOVER_HOUR) days -= 1;
  const [y, m, d] = civilFromDays(days);
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

/** Diferença em dias inteiros entre dois dias (`to` − `from`). */
export function diffDays(from: StudyDay, to: StudyDay): number {
  return toDays(to) - toDays(from);
}

/** Dia da semana ISO (1 = segunda … 7 = domingo): a semana dos congelamentos vai de segunda a domingo (ADR-0027). */
export function isoWeekday(day: StudyDay): number {
  return ((((toDays(day) + 3) % 7) + 7) % 7) + 1; // 1970-01-01 foi quinta (4)
}

/** Soma dias a um dia de estudo. */
export function addDays(day: StudyDay, n: number): StudyDay {
  const [y, m, d] = civilFromDays(toDays(day) + n);
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}
