import { cryptoRandomBytes, uuidv7 } from "../uuidv7";

jest.mock("expo-crypto", () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));

const fixed = (byte: number) => (n: number) => new Uint8Array(n).fill(byte);

describe("uuidv7", () => {
  it("tem versão 7, variante RFC e formato canônico", () => {
    const id = uuidv7(1_700_000_000_000, fixed(0xab));
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("codifica o timestamp nos 48 primeiros bits", () => {
    const ms = 0x0189_abcd_ef01;
    expect(uuidv7(ms, fixed(0)).replace(/-/g, "").slice(0, 12)).toBe("0189abcdef01");
  });

  it("ordena lexicograficamente pelo tempo", () => {
    const ids = [3000, 1000, 2_000_000_000_000, 2000].map((t) => uuidv7(t, fixed(0x11)));
    expect([...ids].sort()).toEqual([ids[1], ids[3], ids[0], ids[2]]);
  });

  it("é determinístico para a mesma entrada", () => {
    expect(uuidv7(42, fixed(7))).toBe(uuidv7(42, fixed(7)));
  });
});

describe("cryptoRandomBytes (celular sem crypto global)", () => {
  const original = globalThis.crypto;
  afterEach(() => Object.defineProperty(globalThis, "crypto", { value: original, configurable: true }));

  it("sem globalThis.crypto (React Native/Hermes) usa o expo-crypto e ainda gera um UUIDv7 válido", () => {
    Object.defineProperty(globalThis, "crypto", { value: undefined, configurable: true });
    expect([...cryptoRandomBytes(16)]).toEqual(new Array(16).fill(7));
    expect(uuidv7(1_700_000_000_000, cryptoRandomBytes)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("com crypto.getRandomValues (web) usa o do navegador", () => {
    const spy = jest.fn((a: Uint8Array) => a.fill(9));
    Object.defineProperty(globalThis, "crypto", { value: { getRandomValues: spy }, configurable: true });
    expect([...cryptoRandomBytes(4)]).toEqual([9, 9, 9, 9]);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
