import { fitMaxEdge, isCompactAudio } from "../media";
import { downsampleMono, parseWav } from "../wav";

function wav16(samples: Int16Array, sampleRate: number, channels: number): ArrayBuffer {
  const dataBytes = samples.byteLength;
  const buf = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buf);
  const write = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, dataBytes, true);
  new Int16Array(buf, 44).set(samples);
  return buf;
}

describe("compressão de mídia", () => {
  it("fitMaxEdge não aumenta imagem pequena e cabe no limite a maior", () => {
    expect(fitMaxEdge(800, 600, 1600)).toBeNull();
    expect(fitMaxEdge(3200, 1800, 1600)).toEqual({ width: 1600, height: 900 });
    expect(fitMaxEdge(1800, 3200, 1600)).toEqual({ width: 900, height: 1600 });
  });

  it("mp3/aac já são compactos; wav não", () => {
    expect(isCompactAudio("audio/mpeg")).toBe(true);
    expect(isCompactAudio("audio/wav")).toBe(false);
  });

  it("wav 44 kHz estéreo vira mono na taxa alvo", () => {
    const samples = new Int16Array(44100 * 2);
    for (let i = 0; i < samples.length; i++) samples[i] = i % 2 === 0 ? 1000 : -1000;
    const pcm = parseWav(wav16(samples, 44100, 2));
    expect(pcm?.sampleRate).toBe(44100);
    const mono = downsampleMono(pcm!, 22050);
    expect(mono.length).toBe(22050);
  });
});
