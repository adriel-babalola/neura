/**
 * Audio container helpers.
 *
 * Pure and environment-free on purpose: the format handling is the part most
 * likely to break silently (a browser silently rejecting unwrapped PCM), so it
 * needs to be unit testable outside a server-only module.
 */

export type PcmInfo = {
  rate: number;
  channels: number;
  bitsPerSample: number;
};

/** Parse `audio/pcm; rate=24000; channels=1`, defaulting to the usual 24k mono. */
export function parsePcmContentType(contentType: string): PcmInfo | null {
  if (!contentType.includes("pcm")) return null;
  const rate = Number(/rate=(\d+)/i.exec(contentType)?.[1]) || 24000;
  const channels = Number(/channels=(\d+)/i.exec(contentType)?.[1]) || 1;
  return { rate, channels, bitsPerSample: 16 };
}

export const WAV_HEADER_BYTES = 44;

/**
 * Wrap signed 16-bit little-endian PCM in a WAV container.
 *
 * Browsers cannot play a bare PCM byte stream, so raw Gemini audio would be
 * unusable without this. WAV is uncompressed, which matches the input exactly:
 * no encoder, no quality loss, and seeking still works.
 */
export function pcmToWav(pcm: ArrayBuffer, info: PcmInfo): ArrayBuffer {
  const blockAlign = (info.channels * info.bitsPerSample) / 8;
  const byteRate = info.rate * blockAlign;
  const out = new Uint8Array(WAV_HEADER_BYTES + pcm.byteLength);
  const view = new DataView(out.buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // format: PCM
  view.setUint16(22, info.channels, true);
  view.setUint32(24, info.rate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, info.bitsPerSample, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, pcm.byteLength, true);

  out.set(new Uint8Array(pcm), WAV_HEADER_BYTES);
  return out.buffer;
}

/**
 * Join synthesised chunks into one playable file.
 *
 * The two formats need different handling:
 *   mp3   frames are self-delimiting, so chunks join byte-for-byte.
 *   wav   every chunk carries its own RIFF header, so a naive join would play
 *         the second header aloud as noise. Strip the later headers, keep the
 *         first chunk's format, and rewrite both sizes.
 */
export function concatAudio(
  parts: ArrayBuffer[],
  contentType: string
): ArrayBuffer {
  if (parts.length === 0) throw new Error("concatAudio: nothing to join");
  if (parts.length === 1) return parts[0];

  if (contentType.includes("wav")) return concatWav(parts);

  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(new Uint8Array(part), offset);
    offset += part.byteLength;
  }
  return out.buffer;
}

function concatWav(parts: ArrayBuffer[]): ArrayBuffer {
  const first = new DataView(parts[0]);
  const channels = first.getUint16(22, true);
  const rate = first.getUint32(24, true);
  const bits = first.getUint16(34, true);

  const totalPayload = parts.reduce(
    (sum, part) => sum + Math.max(0, part.byteLength - WAV_HEADER_BYTES),
    0
  );
  const blockAlign = (channels * bits) / 8;
  const out = new Uint8Array(WAV_HEADER_BYTES + totalPayload);
  const view = new DataView(out.buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + totalPayload, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bits, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, totalPayload, true);

  let offset = WAV_HEADER_BYTES;
  for (const part of parts) {
    // Strip the header from every chunk, including the first: a single shared
    // header was already written above. Emitting the first chunk's own header
    // again would push the payload past the buffer we sized for it.
    const skip = Math.min(WAV_HEADER_BYTES, part.byteLength);
    const length = part.byteLength - skip;
    if (length > 0) {
      out.set(new Uint8Array(part, skip, length), offset);
      offset += length;
    }
  }

  return out.buffer;
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}