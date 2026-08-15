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
      voice: "tara",
      responseFormat: "wav",
    });
    return new NextResponse(new Uint8Array(audio), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    // fall through to Translate proxy
  }

  // Strategy 2: Google Translate TTS proxy (robotic but always available)
  const encoded = encodeURIComponent(text);
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encoded}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://translate.google.com/",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `TTS_FAILED_${res.status}` }, { status: 502 });
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    return NextResponse.json({ error: "TTS_FAILED", detail: message }, { status: 502 });
  }
}
