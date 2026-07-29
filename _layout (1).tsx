const SAMPLE_RATE = 22050;
const DURATION = 6;

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;
  while (i < bytes.length - 2) {
    const b0 = bytes[i++]!;
    const b1 = bytes[i++]!;
    const b2 = bytes[i++]!;
    result +=
      CHARS[b0 >> 2]! +
      CHARS[((b0 & 3) << 4) | (b1 >> 4)]! +
      CHARS[((b1 & 15) << 2) | (b2 >> 6)]! +
      CHARS[b2 & 63]!;
  }
  if (i < bytes.length) {
    const b0 = bytes[i++]!;
    const b1 = i < bytes.length ? bytes[i]! : 0;
    result +=
      CHARS[b0 >> 2]! +
      CHARS[((b0 & 3) << 4) | (b1 >> 4)]! +
      (i < bytes.length ? CHARS[((b1 & 15) << 2)]! : "=") +
      "=";
  }
  return result;
}

export function generateBinauralWAVBase64(leftFreq: number, rightFreq: number): string {
  const numSamples = SAMPLE_RATE * DURATION;
  const numChannels = 2;
  const bitsPerSample = 16;
  const byteRate = SAMPLE_RATE * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const amplitude = 0.4;
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const fade = Math.min(1, Math.min(t * 2, (DURATION - t) * 2));
    const left = amplitude * fade * Math.sin(2 * Math.PI * leftFreq * t);
    const right = amplitude * fade * Math.sin(2 * Math.PI * rightFreq * t);
    view.setInt16(44 + i * 4, Math.round(left * 32767), true);
    view.setInt16(44 + i * 4 + 2, Math.round(right * 32767), true);
  }

  return uint8ToBase64(new Uint8Array(buffer));
}

export function getCacheKey(leftFreq: number, rightFreq: number): string {
  return `binaural_${leftFreq}_${rightFreq}.wav`;
}
