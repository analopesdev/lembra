import { writeFileSync } from "node:fs";

const OUT = new URL("../../../contracts/study-day-vectors/vectors.v1.json", import.meta.url);
const ZONES = [
  "UTC",
  "America/Sao_Paulo",
  "America/New_York",
  "America/St_Johns",
  "Europe/London",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Chatham",
];
const MIN = 60_000;
const WINDOWS = [
  "2026-03-07T00:00:00Z",
  "2026-03-28T00:00:00Z",
  "2026-04-04T00:00:00Z",
  "2026-10-24T00:00:00Z",
  "2026-11-01T00:00:00Z",
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function studyDay(ms, zone) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(f.formatToParts(ms).map((x) => [x.type, x.value]));
  let utc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day));
  if (Number(p.hour) < 4) utc -= 86_400_000;
  return new Date(utc).toISOString().slice(0, 10);
}

const dayMs = (d) => Date.parse(`${d}T00:00:00Z`);
const addDays = (d, n) => new Date(dayMs(d) + n * 86_400_000).toISOString().slice(0, 10);
const isoWeekday = (d) => ((new Date(dayMs(d)).getUTCDay() + 6) % 7) + 1;

const instants = [];
let seed = 7;
for (const zone of ZONES) {
  for (const w of WINDOWS) {
    const start = Date.parse(w);
    for (let i = 0; i < 96; i++) instants.push([zone, start + i * 30 * MIN]);
  }
  const rnd = mulberry32(seed++);
  for (let i = 0; i < 60; i++)
    instants.push([zone, Date.UTC(2020, 0, 1) + Math.floor(rnd() * 11 * 365 * 86_400_000)]);
}

const studyDays = instants.map(([zone, ms]) => ({
  at: new Date(ms).toISOString(),
  zone,
  studyDay: studyDay(ms, zone),
}));

const rnd = mulberry32(99);
const calendar = [];
for (let i = 0; i < 300; i++) {
  const base = addDays("2026-03-10", Math.floor(rnd() * 80000) - 40000);
  const n = Math.floor(rnd() * 8000) - 4000;
  const to = addDays(base, n);
  calendar.push({ from: base, to, diff: n, weekdayFrom: isoWeekday(base), weekdayTo: isoWeekday(to) });
}

writeFileSync(
  OUT,
  JSON.stringify(
    {
      version: 1,
      description:
        "RN-13 / ADR-0027: dia de estudo com virada às 4h no fuso do usuário. Gerado por apps/mobile/scripts/gen-study-day-vectors.mjs com Intl (referência independente).",
      rolloverHour: 4,
      studyDays,
      calendar,
    },
    null,
    1,
  ) + "\n",
);
console.log(`${studyDays.length} instantes, ${calendar.length} pares de calendário`);
