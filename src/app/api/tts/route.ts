import { NextResponse } from "next/server";

const MAX_TEXT = 200;

/**
 * TTS API Route - Proxies Google Translate TTS (free, no key needed).
 * We proxy it server-side to avoid CORS issues in the browser.
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
