import { NextResponse } from "next/server";
import { synthesize as groqSynthesize } from "@/lib/groq-tts";

const MAX_TEXT = 1000;

/**
 * TTS API Route.
 *
 * Strategy 1: Groq Orpheus neural voice (if GROQ_API_KEY is set).
 * Strategy 2: Google Translate TTS proxy (free, no key, robotic fallback).
 * We proxy server-side to avoid CORS issues in the browser.
 */
export async function POST(request: Request) {
  let text = "";

  try {
    const body = await request.json();
    if (typeof body.text === "string") text = body.text.trim().slice(0, MAX_TEXT);
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  // Strategy 1: Groq Orpheus neural voice
  try {
    const { audio, contentType } = await groqSynthesize(text, {
      voice: "diana",
      responseFormat: "wav",
    });
    if (audio && audio.length > 0) {
      return new NextResponse(new Uint8Array(audio), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
    // Empty audio buffer - fall through to fallback
  } catch (err) {
    // Log and fall through to Google Translate proxy
    console.warn(
      "[tts] Groq failed:",
      err instanceof Error ? err.message : String(err)
    );
  }

  // Strategy 2: Google Translate TTS proxy (robotic but always available)
  // Google Translate has a ~200 char limit per request, so chunk if needed.
  const chunks = chunkForGoogleTTS(text, 180);
  const audioChunks: ArrayBuffer[] = [];

  for (const chunk of chunks) {
    const encoded = encodeURIComponent(chunk);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encoded}`;

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://translate.google.com/",
        },
      });

      if (!res.ok) {
        console.warn(`[tts] Google TTS chunk failed: ${res.status}`);
        continue;
      }

      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > 0) {
        audioChunks.push(buffer);
      }
    } catch (err) {
      console.warn(
        "[tts] Google TTS error:",
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  if (audioChunks.length === 0) {
    return NextResponse.json(
      { error: "TTS_FAILED", detail: "All TTS strategies failed" },
      { status: 502 }
    );
  }

  // Concatenate audio chunks
  const totalLen = audioChunks.reduce((sum, buf) => sum + buf.byteLength, 0);
  const combined = new Uint8Array(totalLen);
  let offset = 0;
  for (const buf of audioChunks) {
    combined.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }

  return new NextResponse(combined, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

/**
 * Chunk text for Google Translate TTS which has a ~200 char limit.
 * Splits on sentence boundaries.
 */
function chunkForGoogleTTS(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf(". ", maxLen);
    if (splitAt === -1 || splitAt < 20) splitAt = remaining.lastIndexOf(", ", maxLen);
    if (splitAt === -1 || splitAt < 20) splitAt = remaining.lastIndexOf(" ", maxLen);
    if (splitAt === -1 || splitAt < 20) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt + 1).trim());
    remaining = remaining.slice(splitAt + 1).trim();
  }
  return chunks.filter((c) => c.length > 0);
}
