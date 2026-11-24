import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  cardsToCsv,
  parseBackup,
  serializeBackup,
  type BackupFile,
} from "../backup";

const T = "2026-03-10T10:00:00.000Z";
const base = (): BackupFile => ({
  format: BACKUP_FORMAT,
  version: BACKUP_VERSION,
  exportedAt: T,
  settings: {
    dailyMinutes: 10,
    newCardsPerDay: 5,
    theme: "auto",
    offWeekdays: [7],
    goalText: "",
    updatedAt: T,
  },
  collections: [
    {
      id: "c1",
      name: "Anatomia, I",
      icon: "bone",
      tone: "tint",
      examDay: "2026-12-04",
      createdAt: T,
      updatedAt: T,
    },
  ],
  cards: [
    {
      id: "k1",
      collectionId: "c1",
      front: 'Ela disse "oi"',
      back: "a\nb",
      tags: ["x", "y"],
      importance: 2,
      status: "active",
      createdAt: T,
      updatedAt: T,
    },
  ],
  reviews: [{ id: "r1", cardId: "k1", at: T, rating: 3, retention: 0.9, kind: "review" }],
});

describe("parseBackup", () => {
  it("ida e volta: serializar e ler devolve o mesmo conteúdo", () => {
    const r = parseBackup(serializeBackup(base()));
    expect(r).toEqual({ ok: true, file: base() });
  });

  it("aceita backup sem configurações e sem histórico", () => {
    const r = parseBackup(serializeBackup({ ...base(), settings: null, reviews: [] }));
    expect(r.ok).toBe(true);
  });

  it.each([
    ["texto que não é JSON", "isto não é json", "not_json"],
    ["JSON de outro formato", JSON.stringify({ format: "outra-coisa", version: 1 }), "wrong_format"],
    ["JSON sem formato", JSON.stringify({ a: 1 }), "wrong_format"],
    [
      "versão mais nova que o app",
      JSON.stringify({ ...base(), version: BACKUP_VERSION + 1 }),
      "newer_version",
    ],
  ] as const)("recusa %s", (_n, text, error) => {
    expect(parseBackup(text)).toMatchObject({ ok: false, error });
  });

  it("recusa campo inválido e diz onde", () => {
    const bad = { ...base(), cards: [{ ...base().cards[0], importance: 9 }] };
    expect(parseBackup(JSON.stringify(bad))).toMatchObject({
      ok: false,
      error: "invalid",
      detail: "cards.0.importance",
    });
  });

  it("recusa data fora do padrão ISO", () => {
    const bad = { ...base(), exportedAt: "10/03/2026" };
    expect(parseBackup(JSON.stringify(bad))).toMatchObject({
      ok: false,
      error: "invalid",
      detail: "exportedAt",
    });
  });

  it("recusa card de coleção inexistente e revisão de card inexistente", () => {
    const orphanCard = { ...base(), cards: [{ ...base().cards[0], collectionId: "nao-existe" }] };
    expect(parseBackup(JSON.stringify(orphanCard))).toMatchObject({
      ok: false,
      error: "broken_reference",
      detail: "cards.collectionId",
    });
    const orphanReview = { ...base(), reviews: [{ ...base().reviews[0], cardId: "nao-existe" }] };
    expect(parseBackup(JSON.stringify(orphanReview))).toMatchObject({
      ok: false,
      error: "broken_reference",
      detail: "reviews.cardId",
    });
  });
});

describe("cardsToCsv", () => {
  it("escreve cabeçalho e escapa vírgula, aspas e quebra de linha (RFC 4180)", () => {
    const csv = cardsToCsv(base().cards, base().collections);
    expect(csv).toBe(
      'colecao,frente,verso,tags,importancia,status\r\n"Anatomia, I","Ela disse ""oi""","a\nb",x;y,2,active\r\n',
    );
  });

  it("sem cards só tem o cabeçalho", () => {
    expect(cardsToCsv([], [])).toBe("colecao,frente,verso,tags,importancia,status\r\n");
  });

  it("coleção desconhecida fica em branco", () => {
    expect(cardsToCsv(base().cards, [])).toContain("\r\n,");
  });
});
