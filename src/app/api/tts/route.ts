import { NextResponse } from "next/server";
import { synthesize, VOICES } from "@/lib/groq-tts";

const MAX_TEXT = 600;

// Simple in-memory cache (up to 60 entries)
const cache = new Map<string, { audio: Buffer; contentType: string }>();
const MAX_CACHE = 60;

function cacheKey(text: string, voice: string) {
  return `${voice}::${text}`;
}

export async function POST(request: Request) {
  let text = "";
  let voice = VOICES.friendly;

  try {
    const body = await request.json();
    if (typeof body.text === "string") text = body.text.trim().slice(0, MAX_TEXT);
    if (typeof body.voice === "string" && body.voice.trim()) voice = body.voice.trim();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  // Check cache
  const key = cacheKey(text, voice);
  const cached = cache.get(key);
  if (cached) {
    return new NextResponse(
      cached.audio.buffer.slice(
        cached.audio.byteOffset,
        cached.audio.byteOffset + cached.audio.byteLength
      ) as ArrayBuffer,
      {
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=7200",
        },
      }
    );
  }

  // Synthesize with Groq TTS
  const started = Date.now();
  try {
    const result = await synthesize(text, {
      voice,
      speed: 0.95,
      responseFormat: "mp3",
    });

    // Cache the result
    if (cache.size >= MAX_CACHE) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, result);

    console.log(
      `[tts] ok ${Date.now() - started}ms (${result.contentType}, ${Math.round(result.audio.length / 1024)}KB) "${text.slice(0, 50)}"`
    );

    return new NextResponse(
      result.audio.buffer.slice(
        result.audio.byteOffset,
        result.audio.byteOffset + result.audio.byteLength
      ) as ArrayBuffer,
      {
        headers: {
          "Content-Type": result.contentType,
          "Cache-Control": "public, max-age=7200",
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    console.error(`[tts] error ${Date.now() - started}ms: ${message} "${text.slice(0, 60)}"`);

    if (message.includes("NO_KEY")) {
      return NextResponse.json({ error: "NO_KEY", detail: "Set GROQ_API_KEY in environment" }, { status: 503 });
    }
    if (message.includes("RATE_LIMITED")) {
      return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }
    return NextResponse.json(
      { error: "TTS_FAILED", detail: message },
      { status: 502 }
    );
  }
}
