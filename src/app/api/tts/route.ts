import { NextResponse } from "next/server";

const MODEL = "gemini-2.5-flash-preview-tts";
const DEFAULT_VOICE = "Kore";
const MAX_TEXT = 500;
const RETRY_STATUS = new Set([400, 429, 500, 502, 503]);
const BACKOFF_MS = [1500, 4000, 9000];

const cache = new Map<string, { data: string; mime: string }>();
let lastUpstreamAt = 0;
let quotaBlockedUntil = 0;
let quotaHitThisCall = false;

function quotaError() {
  return NextResponse.json({ error: "QUOTA_EXHAUSTED" }, { status: 429 });
}

function toWav(pcm: Buffer, sampleRate = 24000, channels = 1, bits = 16): Buffer {
  const blockAlign = (channels * bits) / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bits, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function cacheKey(text: string, voice: string) {
  return `${voice}::${text}`;
}

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.includes("PASTE_")) return null;
  return key;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function paceUpstream() {
  const MIN_GAP_MS = 400;
  const wait = Math.max(0, lastUpstreamAt + MIN_GAP_MS - Date.now());
  if (wait > 0) await sleep(wait);
  lastUpstreamAt = Date.now();
}

async function synthesizeUpstream(apiKey: string, text: string, voice: string) {
  let lastRes: Response | null = null;
  for (let attempt = 0; attempt < BACKOFF_MS.length; attempt++) {
    await paceUpstream();
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              response_modalities: ["AUDIO"],
              speech_config: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice },
                },
              },
            },
          }),
        }
      );
      lastRes = res;
    } catch (err) {
      console.log(`[tts] network error attempt ${attempt + 1}: ${err instanceof Error ? err.message : err}`);
      await sleep(BACKOFF_MS[attempt]);
      continue;
    }
    if (res.ok || !RETRY_STATUS.has(res.status)) return res;
    if (res.status === 429) {
      const detail = await res.text().catch(() => "");
      const isQuota = /quota/i.test(detail);
      if (isQuota) {
        quotaBlockedUntil = Date.now() + 10 * 60_000;
        quotaHitThisCall = true;
        console.log(`[tts] upstream QUOTA_EXHAUSTED — blocking /api/tts for 10 min ("${text.slice(0, 50)}")`);
        return res;
      }
    }
    console.log(
      `[tts] upstream ${res.status} attempt ${attempt + 1}/${BACKOFF_MS.length} "${text.slice(0, 50)}" — backing off ${BACKOFF_MS[attempt]}ms`
    );
    await sleep(BACKOFF_MS[attempt]);
  }
  return lastRes!;
}

export async function POST(request: Request) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "NO_KEY" }, { status: 503 });
  }

  if (Date.now() < quotaBlockedUntil) {
    return quotaError();
  }

  let text = "";
  let voice = DEFAULT_VOICE;
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

  const key = cacheKey(text, voice);
  const cached = cache.get(key);
  if (cached) {
    const cachedBuf = Buffer.from(cached.data, "base64");
    return new NextResponse(
      cachedBuf.buffer.slice(
        cachedBuf.byteOffset,
        cachedBuf.byteOffset + cachedBuf.byteLength
      ) as ArrayBuffer,
      {
        headers: {
          "Content-Type": cached.mime,
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  }

  const started = Date.now();
  let res: Response;
  try {
    quotaHitThisCall = false;
    res = await synthesizeUpstream(apiKey, text, voice);
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    return NextResponse.json({ error: "NETWORK", detail: message }, { status: 502 });
  }

  if (!res.ok) {
    if (quotaHitThisCall) return quotaError();
    const detail = await res.text().catch(() => "");
    console.error(`[tts] upstream ${res.status} for "${text.slice(0, 60)}": ${detail.slice(0, 200)}`);
    return NextResponse.json(
      { error: `TTS_FAILED:${res.status}`, detail: detail.slice(0, 300) },
      { status: 502 }
    );
  }

  const data = await res.json();
  const part = data?.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { data?: string } }) => p?.inlineData?.data
  );
  const inline = part?.inlineData;
  if (!inline?.data) {
    return NextResponse.json({ error: "TTS_EMPTY" }, { status: 502 });
  }

  const mimeRaw = inline.mimeType || "audio/mpeg";
  const mimeBase = mimeRaw.split(";")[0].trim().toLowerCase();
  let mime = mimeRaw;
  let audio: Buffer;
  if (mimeBase === "audio/l16") {
    audio = toWav(Buffer.from(inline.data, "base64"));
    mime = "audio/wav";
  } else {
    audio = Buffer.from(inline.data, "base64");
  }

  if (cache.size >= 40) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data: audio.toString("base64"), mime });

  console.log(`[tts] ok ${Date.now() - started}ms (${mime}, ${Math.round(audio.length / 1024)}KB) "${text.slice(0, 50)}"`);
  return new NextResponse(
    audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer,
    {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
